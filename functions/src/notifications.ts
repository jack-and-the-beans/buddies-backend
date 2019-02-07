import { EventContext, Change } from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as constants from './constants'
import * as algoliasearch from 'algoliasearch'
import Refs from './firestoreRefs'
import * as _ from 'lodash'

type ActivityData = {
    activityId: string,
    ownerId: string,
    topicIds: string[],
    coords: FirebaseFirestore.GeoPoint,
}

export default class Notifications {
    database: FirebaseFirestore.Firestore
    algoliaClient: algoliasearch.Client
    messaging: admin.messaging.Messaging
    constructor(database: FirebaseFirestore.Firestore, algoliaClient: algoliasearch.Client , messaging: admin.messaging.Messaging) {
        this.database = database
        this.algoliaClient = algoliaClient
        this.messaging = messaging
    }

    async activityCreationHandler(snap: FirebaseFirestore.DocumentSnapshot, context: EventContext) {
        const newData = this.getActivityData(snap)
        if (!newData) return -1
    
        return this.sendUsersActivityNotification(newData, this.algoliaClient.initIndex(constants.USER_INDEX_NAME), this.messaging)
    }
    
    async sendUsersActivityNotification(activityData: ActivityData, index: algoliasearch.Index, messageService: admin.messaging.Messaging) {
        const { activityId, ownerId, topicIds, coords } = activityData
    
        // Search for users nearby the activity and who have 
        // favorited one of the topics of the activity
        const searchResult = (await index.search({
            aroundLatLng: `${coords.latitude}, ${coords.longitude}`,
            aroundRadius: constants.USER_SEARCH_RADIUS,
            filters: this.getTopicFilter(topicIds),
        })).hits as AlgoliaUser[]
    
        // Send a notification to each user:
        return Promise.all(this.getUsersForNotification(searchResult, ownerId).map(async usr => {
            const notificationToken = usr.notification_token
            await messageService.send(this.createActivityNotification(notificationToken, activityId))
        }))
    }
    
    // Only use users who have not blocked the owner of the activity
    // (or who have not been blocked by the owner), and who have a notification token,
    // and who have their notification setting set to true
    getUsersForNotification(users: AlgoliaUser[], ownerId: string): AlgoliaUser[] {
        return users.filter(usr => (
            usr.block_filter.indexOf(ownerId) === -1 &&
            usr.notification_token.length > 0 &&
            usr.should_send_activity_suggestion_notification === true
        ))
    }
    
    // Filter by any favorite topic - the result must match at least one
    // Translates the topics array into a string for algolia filter
    getTopicFilter(topics: string[]): string {
        return topics.map(id => `favorite_topics:${id}`).join(' OR ')
    }
    
    getActivityData(snap: FirebaseFirestore.DocumentSnapshot): ActivityData | null {
        const newData = snap.data()
        if (!newData) {
            return null
        }
        const activityId = snap.id ? snap.id : null
        const ownerId: string = newData.owner_id ? newData.owner_id : null
        const topicIds: string[] | null= newData.topic_ids ? newData.topic_ids : null
        const coords: FirebaseFirestore.GeoPoint | null = newData.location ? newData.location : null
        if (!topicIds || !coords || !ownerId || !activityId) {
            return null
        }
        return {
            activityId,
            ownerId,
            topicIds,
            coords,
        }
    }
    
    createActivityNotification(token: string, activity_id: string): admin.messaging.Message {
        return {
            token: token,
            notification: {
                title: "A new activity has been created near you!",
                body: "You'll love this activity!"
            },
            data: { activity_id },
        }
    }
    
    // Sends a message to a chat if a user leaves or joins it:
    async onActivityUsersChanged(change: Change<FirebaseFirestore.DocumentSnapshot>, context: EventContext) {
        const activityId: string = change.after.id
        const usersBefore = this.getUsersFromChange(change.before)
        const usersAfter = this.getUsersFromChange(change.after)
    
        const [joined, left] = this.getUserDiff(usersBefore, usersAfter)
    
        const joinedTasks = joined.map(async (uid) => {
            const userInfo = await Refs(this.database).user(uid).get()
            const userData = userInfo.data()
            if (userInfo.exists && userData) {
                const msgBody = `${userData.name} has joined your activity.`
                await this.sendChatMessage(activityId, msgBody, uid, new Date())    
            }
        })
    
        const leftTasks = left.map(async (uid) => {
            const msgBody = 'A user has left your activity.'
            await this.sendChatMessage(activityId, msgBody, uid, new Date())
        })
    
        return Promise.all([...joinedTasks, ...leftTasks])
    }
    
    // Sends a user left/joined message to the specified activity
    sendChatMessage(activityId: string, message: string, sender: string, date: Date) {
        const chatRef = Refs(this.database).chat(activityId)
        return chatRef.add({
            message,
            sender,
            date_sent: date,
            type: 'user_join_or_leave'
        })
    }
    
    // Gets the the array of activity members from the activity doc.
    getUsersFromChange(doc: FirebaseFirestore.DocumentSnapshot): string[] {
        const data1 = doc.data()
        const arr1: string[] = (data1 && data1.members && Array.isArray(data1.members)) ? data1.members : []
        return arr1
    }
    
    // Returns an a tuple where each element is an array of strings:
    // [ usersWhoJoined, usersWhoLeft ]
    getUserDiff(before: string[], after: string[]): [string[], string[]] {
        const usersWhoJoined = _.difference(after, before) // People in after, but not in before
        const usersWhoLeft = _.difference(before, after) // People in before but not in after
        return [ usersWhoJoined, usersWhoLeft ]
    }
    
    async newMessageHandler(snap: FirebaseFirestore.DocumentSnapshot, context: EventContext) {
        const activity_id = context.params.activity_id
        const activityDoc = await Refs(this.database).activity(activity_id).get()
        const activity = activityDoc.data() as Activity
        const chatMessage = snap.data() as ChatMessage
    
        const tokens = await this.getTokensForChatNotification(activity.members, chatMessage.sender, this.database)
    
        // Send a notification to each token based on the message:
        return Promise.all(tokens.map(async (token: string) => {
            const message = this.createChatNotification(token, activity_id, `${activity.title}`, chatMessage.message)
            await this.messaging.send(message)
        }))
    }
    
    async getTokensForChatNotification(userIds: string[], senderId: string, db: FirebaseFirestore.Firestore): Promise<string[]> {
        // Make sure they're unique
        const user_ids = [...new Set(userIds)]
        // Get the document for each user other than the owner:
        const userDocs = await Promise.all(user_ids.reduce((val: Promise<FirebaseFirestore.DocumentSnapshot>[], memberId: string) => {
            if (memberId !== senderId) {
                val.push(Refs(db).user(memberId).get())
            }
            return val
        }, []))
        // Get the notification token for each user if the user exists and if the token
        // is a string that is not empty.
        const tokens = userDocs.reduce((val: string[], doc: FirebaseFirestore.DocumentSnapshot) => {
            const data = doc.data()
            if (doc.exists && data) {
                const token = data.notification_token ? data.notification_token : null
                // If users notification preference is defined, use it. Otherwise, default the preference to true.
                const notificationPref = data.should_send_joined_activity_notification != null ? data.should_send_joined_activity_notification : true
                if (token && typeof token === 'string' && token.length > 0 && notificationPref) {
                    // Only add the token if the user has a valid token, and if the user is ok with receiving notifications.
                    val.push(token)
                }
            }
            return val
        }, [])
        // Remove duplicates and return the array of tokens:
        return [...new Set(tokens)]
    }
    
    createChatNotification(token: string, activity_id: string, title: string, message: string): admin.messaging.Message {
        return {
            token,
            notification: { title, body: message },
            data: { activity_id: activity_id },
            apns: { payload: { aps: { 'thread-id': activity_id } } }
        }
    }
}
