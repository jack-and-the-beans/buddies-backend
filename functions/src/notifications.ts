import { firestore } from 'firebase-functions'
import * as admin from 'firebase-admin'
import refs from '../../firestoreRefs.js'
try { admin.initializeApp() } catch (e) {}


export const onActivityCreation = firestore.document('activities/{activityId}').onCreate(async (snap, context) => {
    const newData = snap.data()
    const topicIds: string[] = newData ? newData.topic_ids : null
    if (!topicIds) {
        return 0
    }

    // 1. Get all users who have one of the topics as a favorite
    // 2. Add each user to a map to ensure uniqueness.
    const users = new Map()
    // Note: this will wait for all of the db calls to finish
    // before moving along. So users will have full data.
    await Promise.all(topicIds.map(async (topic: string) => {
        const data = await refs(admin.firestore())
            .users()
            .where('favorite_topics', 'array-contains', topic)
            .get()
        data.docs.forEach(doc => {
            const d = doc.data()
            const uid = d.uid as string
            const notification_token = d.notification_token as string
            users.set(uid, notification_token)
        })
    }))

    // Send a notification to each user:
    users.forEach((uid: string, notification_token: string) => {
        const notificationText = 'A new activity has been created near you!'
    })
    return 0
})
