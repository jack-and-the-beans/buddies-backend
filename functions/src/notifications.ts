import { EventContext } from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as constants from './constants'
import * as algoliasearch from 'algoliasearch'
try { admin.initializeApp() } catch (e) {}

type ActivityData = {
    activityId: string,
    ownerId: string,
    topicIds: string[],
    coords: FirebaseFirestore.GeoPoint,
}

export async function activityCreationHandler(snap: FirebaseFirestore.DocumentSnapshot, context: EventContext) {
    const newData = exports.getActivityData(snap)
    if (!newData) return -1

    const client = algoliasearch(constants.ALGOLIA_APP_ID, constants.ALGOLIA_SEARCH_API_KEY)
    const index = client.initIndex(constants.USER_INDEX_NAME)

    return exports.sendUsersActivityNotification(newData, index, admin.messaging())
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