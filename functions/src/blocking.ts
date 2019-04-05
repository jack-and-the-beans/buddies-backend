import { EventContext } from 'firebase-functions'
import { CallableContext } from 'firebase-functions/lib/providers/https'
import * as admin from 'firebase-admin'
import Ref from './firestoreRefs'
import { get, includes } from 'lodash'

export default class Blocking {
    constructor(public db: FirebaseFirestore.Firestore) { }

    block = async (type: 'user' | 'activity', blocker_id: string, blocked_id: string) => {

        //use a batch to atomically update both users, works offline
        const batch = this.db.batch();
    
        const refs = Ref(this.db);
    
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

    blockUserOnCall = async (data: any, context: CallableContext) => {
        await this.block('user', data.blocker_id, data.blocked_id);
    }

    newReportedUser = async (snap: FirebaseFirestore.DocumentSnapshot, context: EventContext) => {
        const { actor_id, target_id } = this.getReportIds('report_by_id', 'reported_user_id', snap);
        if(actor_id && target_id){
            await this.block('user', actor_id, target_id);
            await this.removeMyselfFromSharedActivities(actor_id, target_id)
        } else {
            console.error(`Blocker "${actor_id}" or blocked "${target_id}" does not exist`);
        }
    }

    newReportedActivity = async (snap: FirebaseFirestore.DocumentSnapshot, context: EventContext) => {
        const { actor_id, target_id } = this.getReportIds('report_by_id', 'reported_activity_id', snap);
        if(actor_id && target_id){
            await this.block('activity', actor_id, target_id);
            const ref = Ref(this.db).activities().doc(target_id)
            await this.updateActivityOnBlock(ref, actor_id)
        } else {
            console.error(`Blocker "${actor_id}" or blocked "${target_id}" does not exist`);
        }
    }

    getReportIds = (actorField: string, targetField: string, snap: FirebaseFirestore.DocumentSnapshot) => {
        const newReport = snap.data();
        const actor_id = newReport ? newReport[actorField] : null;
        const target_id = newReport ? newReport[targetField] : null;
        return { actor_id, target_id };
    }

    // We want to remove ME from evry activity I share with "blockedUser"
    removeMyselfFromSharedActivities = async (me: string, blockedUser: string) => {
        // Query for all activities which I am in. Note that we cannot
        // chain array-contains to include multiple values
        const query = Ref(this.db).activities().where('members', 'array-contains', me)
        const results = await query.get()

        // Find all of my activities which include the blocked user
        const matchingActivities = results.docs.filter( doc => {
            const data = doc.data()
            const members = get(data, 'members', []) as string[]
            return includes(members, blockedUser)
        })
        
        // Handle remove/ban on each shared activity:
        const tasks = matchingActivities.map( ({ ref }) => this.updateActivityOnBlock(ref, me) )
        
        // Execute all update tasks in parallel
        await Promise.all(tasks)
    }

    // When we report/block an activity, or report/block a user in the activity, we want to:
    // 1) remove ourselves from the activity and 2) ban ourselves from the activity.
    updateActivityOnBlock = async (activityRef: FirebaseFirestore.DocumentReference, me: string) => {
        // Remove myself from members; add myself to ban list:
        await activityRef.update({
            members: admin.firestore.FieldValue.arrayRemove(me),
            banned_users: admin.firestore.FieldValue.arrayUnion(me)
        })
    }
}
