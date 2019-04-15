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

    // I want to remove myself from evry activity I share with `blockedUser`.
    // If I own the activity, I want to remove them instead.
    removeMyselfFromSharedActivities = async (me: string, blockedUser: string) => {
        // Query for all activities which I am in. Note that we cannot
        // chain array-contains to include multiple values
        const query = Ref(this.db).activities().where('members', 'array-contains', me)
        const results = await query.get()

        // Find all of my activities which include the blocked user
        // and which are not owned by me
        const matchingActivities = results.docs.filter( doc => {
            const data = doc.data()
            const members = get(data, 'members', []) as string[]
            return includes(members, blockedUser)
        })
        
        // Handle remove/ban on each shared activity:
        const tasks = matchingActivities.map( doc => {
            // Remove and ban me if someone else owns the activity.
            // Remove and ban the other person if I own the activity.
            const amOwner = doc.data().owner_id === me
            const personToRemove = amOwner ? blockedUser : me

            return this.updateActivityOnBlock(doc.ref, personToRemove)
        })
        
        // Execute all update tasks in parallel
        await Promise.all(tasks)
    }

    // When we report/block an activity or user, we generally also want to remove the person
    // from the activity and also add them to the activity ban list.
    updateActivityOnBlock = async (activityRef: FirebaseFirestore.DocumentReference, personToBlock: string) => {
        await activityRef.update({
            members: admin.firestore.FieldValue.arrayRemove(personToBlock),
            banned_users: admin.firestore.FieldValue.arrayUnion(personToBlock)
        })
    }
}
