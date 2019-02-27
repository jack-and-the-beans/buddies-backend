
// Inject a firestore instance:
export default function refs(firestore: FirebaseFirestore.Firestore) {
    return {
        activities: () => firestore.collection('activities'),
        activity: (activityId: string) => firestore.collection('activities').doc(activityId),
        chat: (activityId: string) => firestore.collection('activities').doc(activityId).collection('chat'),
        accounts: () => firestore.collection('accounts'),
        account: (userId: string) => firestore.collection('accounts').doc(userId),
        public_user: (userId: string) => firestore.collection('users').doc(userId)
    }
}