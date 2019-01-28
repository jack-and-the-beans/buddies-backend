
// Inject a firestore instance that needs to be called:
export function refs(firestore) {
    return {
        activities: () => firestore().collection('activities'),
        activity: (activityId) => firestore.collection('activities').doc(activityId),
        chat: (activityId) => firestore.collection('activities').doc(activityId).collection('chat'),
    }
}