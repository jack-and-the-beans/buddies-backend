import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
// import refs from '../../firestoreRefs.js'
try { admin.initializeApp() } catch (e) {}

const db = admin.firestore();

export async function blockUser(blocker_id: string, blocked_id: string): Promise<void> {
    //use a batch to atomically update both users, works offline
    var batch = db.batch();
    var blockerRef = db.collection("users").doc(blocker_id);
    var blockedRef = db.collection("users").doc(blocked_id);

    batch.update(blockerRef, {
        blocked_users: admin.firestore.FieldValue.arrayUnion(blocked_id)
    });
    batch.update(blockedRef, {
        blocked_by: admin.firestore.FieldValue.arrayUnion(blocker_id)
    });

    try {
        await batch.commit();
        console.log(`${blocker_id} successfully blocked ${blocked_id}`);
    } catch(e) {
        console.error(`${blocker_id} failed blocking ${blocked_id}`);
        console.error(e);
    }
}

export const blockUserHTTPS = functions.https.onCall(async (data, context) => {
    await blockUser("Y1VnYNcmbPZrpQe53zs8byWpYaG2","Y1VnYNcmbPZrpQe53zs8byWpYaG2");
})
