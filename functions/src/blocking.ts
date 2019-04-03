import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Ref from './firestoreRefs'
import { get, includes } from 'lodash'

// import refs from '../../firestoreRefs.js'
try { admin.initializeApp() } catch (e) {}

const db = admin.firestore();

export async function block(type: 'user' | 'activity', blocker_id: string, blocked_id: string): Promise<void> {

    //use a batch to atomically update both users, works offline
    const batch = db.batch();

    const refs = Ref(db);

    if(type === "user"){
        const blockerRef = refs.account(blocker_id);
        const blockedRef = refs.account(blocked_id);

        batch.update(blockedRef, {
            blocked_by: admin.firestore.FieldValue.arrayUnion(blocker_id)
        });

        batch.update(blockerRef, {
            blocked_users: admin.firestore.FieldValue.arrayUnion(blocked_id)
        });
    } else if (type === "activity"){
        const blockerRef = refs.account(blocker_id);
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
            await removeMyselfFromSharedActivities(actor_id, target_id)
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


// We want to remove ME from evry activity I share with "blockedUser"
 async function removeMyselfFromSharedActivities(me: string, blockedUser: string): Promise<void> {
     // Query for all activities which I am in. Note that we cannot
     // chain array-contains to include multiple values
    const query = db.collection('activities').where('members', 'array-contains', me)
    const results = await query.get()

    // Find all of my activities which include the blocked user
    const matchingActivities = results.docs.filter( doc => {
        const data = doc.data()
        const members = get(data, 'members', []) as string[]
        return includes(members, blockedUser)
    })
    
    // Remove myself from each shared activity
    const tasks = matchingActivities.map( ({ ref }) => ref.update({
            members: admin.firestore.FieldValue.arrayRemove(me)
        })
    )
    // Execute all update tasks in parallel
    await Promise.all(tasks)
}
