import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
// import refs from '../../firestoreRefs.js'
try { admin.initializeApp() } catch (e) {}

const db = admin.firestore();

export async function block(type: string, blocker_id: string, blocked_id: string): Promise<void> {

    //use a batch to atomically update both users, works offline
    const batch = db.batch();

    if(type == "user"){
        const blockerRef = db.collection("users").doc(blocker_id);
        const blockedRef = db.collection("users").doc(blocked_id);

        batch.update(blockedRef, {
            blocked_by: admin.firestore.FieldValue.arrayUnion(blocker_id)
        });

        batch.update(blockerRef, {
            blocked_users: admin.firestore.FieldValue.arrayUnion(blocked_id)
        });
    } else if (type == "activity"){
        const blockerRef = db.collection("users").doc(blocker_id);
        batch.update(blockerRef, {
            blocked_activities: admin.firestore.FieldValue.arrayUnion(blocked_id)
        });
    }

    try {
        await batch.commit();
    } catch(e) {
        console.error(`User ${blocker_id} failed blocking ${type} ${blocked_id}`);
        console.error(e);
        throw e;
    }
}

export const blockUserOnCall = functions.https.onCall(async (data, context) => {
    await block('user', data.blocker_id, data.blocked_id);
})

export function getReportIds(actorField: string, targetField: string, snap: FirebaseFirestore.DocumentSnapshot){
    const newReport = snap.data();
    const actor_id = newReport ? newReport[actorField] : null;
    const target_id = newReport ? newReport[targetField] : null;
    return { actor_id, target_id };
}


export const newReportedUser = functions.firestore
    .document('user_report/{reportId}').onCreate(async (snap, context) => {
        const { actor_id, target_id } = getReportIds('report_by_id', 'reported_user_id', snap);
        if(actor_id && target_id){
            await block('user', actor_id, target_id);
        } else {
            console.error(`Blocker "${actor_id}" or blocked "${target_id}" does not exist`);
        }
    });



export const newReportedActivity = functions.firestore
    .document('activity_report/{reportId}').onCreate(async (snap, context) => {
        const { actor_id, target_id } = getReportIds('report_by_id', 'reported_activity_id', snap);
        if(actor_id && target_id){
            await block('activity', actor_id, target_id);
        } else {
            console.error(`Blocker "${actor_id}" or blocked "${target_id}" does not exist`);
        }
    });


