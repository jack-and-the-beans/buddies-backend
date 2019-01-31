import { EventContext } from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as constants from './constants'
import * as algoliasearch from 'algoliasearch'
import { algoliaMock, messagingMock, firestoreMock } from './test/mocks'
import Refs from './firestoreRefs'

try { admin.initializeApp() } catch (e) {}

type ActivityData = {
    activityId: string,
    ownerId: string,
    topicIds: string[],
    coords: FirebaseFirestore.GeoPoint,
}

const isTestMode = process.env.NODE_ENV === 'test'
const client = isTestMode ? algoliaMock() : algoliasearch(constants.ALGOLIA_APP_ID, constants.ALGOLIA_SEARCH_API_KEY)
const messaging = isTestMode ? messagingMock : admin.messaging()
const database = isTestMode ? firestoreMock : admin.firestore()

export async function activityCreationHandler(snap: FirebaseFirestore.DocumentSnapshot, context: EventContext) {
    const newData = exports.getActivityData(snap)
    if (!newData) return -1

    return exports.sendUsersActivityNotification(newData, client.initIndex(constants.USER_INDEX_NAME), messaging)
}

export async function sendUsersActivityNotification(activityData: ActivityData, index: algoliasearch.Index, messageService: admin.messaging.Messaging) {
    const { activityId, ownerId, topicIds, coords } = activityData

    // Search for users nearby the activity and who have 
    // favorited one of the topics of the activity
    const searchResult = (await index.search({
        aroundLatLng: `${coords.latitude}, ${coords.longitude}`,
        aroundRadius: constants.USER_SEARCH_RADIUS,
        filters: getTopicFilter(topicIds),
    })).hits as AlgoliaUser[]

    // Send a notification to each user:
    return Promise.all(getUsersForNotification(searchResult, ownerId).map(async usr => {
        const notificationToken = usr.notification_token
        await messageService.send(createActivityNotification(notificationToken, activityId))
    }))
}

// Only use users who have not blocked the owner of the activity
// (or who have not been blocked by the owner), and who have a notification token,
// and who have their notification setting set to true
export function getUsersForNotification(users: AlgoliaUser[], ownerId: string): AlgoliaUser[] {
    return users.filter(usr => (
        usr.block_filter.indexOf(ownerId) === -1 &&
        usr.notification_token.length > 0 &&
        usr.should_send_activity_suggestion_notification === true
    ))
}

// Filter by any favorite topic - the result must match at least one
// Translates the topics array into a string for algolia filter
export function getTopicFilter(topics: string[]): string {
    return topics.map(id => `favorite_topics:${id}`).join(' OR ')
}

export function getActivityData(snap: FirebaseFirestore.DocumentSnapshot): ActivityData | null {
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

export function createActivityNotification(token: string, activity_id: string): admin.messaging.Message {
    return {
        token: token,
        notification: {
            title: "A new activity has been created near you!",
            body: "You'll love this activity!"
        },
        data: { activity_id },
    }
}

export async function newMessageHandler(snap: FirebaseFirestore.DocumentSnapshot, context: EventContext) {
    const activity_id = context.params.activity_id
    // @ts-ignore because it doesn't like the mock
    const activityDoc = await Refs(database).activity(activity_id).get()
    const activity = activityDoc.data() as Activity
    const chatMessage = snap.data() as ChatMessage

    // @ts-ignore because it doesn't like the mock
    const tokens = await getTokensForChatNotification(activity.members, chatMessage.sender, database)

    // Send a notification to each token based on the message:
    return Promise.all(tokens.map(async (token: string) => {
        const message = createChatNotification(token, activity_id, `New message in ${activity.title}:`, chatMessage.message)
        await messaging.send(message)
    }))
}

export async function getTokensForChatNotification(userIds: string[], senderId: string, db: FirebaseFirestore.Firestore): Promise<string[]> {
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
        if (doc.exists) {
            const data = doc.data()
            const token = data && data.notification_token ? data.notification_token : null
            if (token && typeof token === 'string' && token.length > 0) {
                val.push(token)
            }
        }
        return val
    }, [])
    // Remove duplicates and return the array of tokens:
    return [...new Set(tokens)]
}

export function createChatNotification(token: string, activity_id: string, title: string, message: string): admin.messaging.Message {
    return {
        token,
        notification: { title, body: message },
        data: { activity_id: activity_id },
        apns: { payload: { aps: { 'thread-id': activity_id } } }
    }
}