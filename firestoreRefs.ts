
// Inject a firestore instance:
export default function refs(firestore: FirebaseFirestore.Firestore) {
    return {
        activities: () => firestore.collection('activities'),
        activity: (activityId: string) => firestore.collection('activities').doc(activityId),
        chat: (activityId: string) => firestore.collection('activities').doc(activityId).collection('chat'),
        users: () => firestore.collection('users'),
    }
}