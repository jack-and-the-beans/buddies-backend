import { firestore } from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as constants from './constants'
import * as algoliasearch from 'algoliasearch'
try { admin.initializeApp() } catch (e) {}

const client = algoliasearch(constants.ALGOLIA_APP_ID, constants.ALGOLIA_SEARCH_API_KEY)

export const onActivityCreation = firestore.document('activities/{activityId}').onCreate(async (snap, context) => {
    const newData = snap.data()
    if (!newData) {
        return
    }
    // Validate data:
    const activityId = snap.id
    const ownerId: string = newData.owner_id
    const topicIds: string[] | null= newData.topic_ids ? newData.topic_ids : null
    const coords: FirebaseFirestore.GeoPoint | null = newData.location ? newData.location : null
    if (!topicIds || !coords) {
        return 0
    }

    const index = client.initIndex(constants.USER_INDEX_NAME)

    // Filter by any favorite topic - the result must match at least one
    const topicFilter = topicIds.map(id => `favorite_topics:${id}`).join(' OR ')

    // Search for users nearby the activity and who have 
    // favorited one of the topics of the activity
    const searchResult = (await index.search({
        aroundLatLng: `${coords.latitude}, ${coords.longitude}`,
        aroundRadius: constants.USER_SEARCH_RADIUS,
        filters: topicFilter,
    })).hits as AlgoliaUser[]

    // Only use users who have not blocked the owner of the activity
    // (or who have not been blocked by the owner), and who have a notification token:
    const users = searchResult.filter(usr => usr.block_filter.indexOf(ownerId) === -1 && usr.notification_token.length > 0)

    // Send a notification to each user:
    return Promise.all(users.map(async usr => {
        const notificationToken = usr.notification_token
        await admin.messaging().send(createActivityNotification(notificationToken, activityId))
    }))
})

function createActivityNotification(token: string, activity_id: string): admin.messaging.Message {
    return {
        token,
        notification: {
            title: "A new activity has been created near you!",
            body: "You'll love this activity!"
        },
        data: { activity_id },
    }
}