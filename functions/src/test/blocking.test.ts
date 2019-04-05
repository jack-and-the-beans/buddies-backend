import * as assert from 'assert';
import * as admin from 'firebase-admin';
import 'mocha';
import Blocking from '../blocking';
import { FeaturesList } from 'firebase-functions-test/lib/features';
import { getTestFeatureList } from './config';
import * as mocks from './mocks'
import * as sinon from 'sinon'

// Ideally, we would use the mock for this, but we want to make sure our existing tests keep working:
admin.initializeApp()
const blocking = new Blocking(admin.firestore())

describe("Block function", () => {

    describe("Block User Typescript func", () => {
        let db: FirebaseFirestore.Firestore, test : FeaturesList;
        
        before(async ()=>{
            test = getTestFeatureList();
            db = admin.firestore();
            await db.collection('accounts').doc("blocker_guy").set({"name": "our blocker_guy"});
            await db.collection('accounts').doc("blocked_guy").set({"name": "our blocked_guy"});
        })

        after(()=> { test.cleanup(); })

        it("Denormalizes data for an arbitrary blocker and blockee", async ()=>{
            await blocking.block('user', "blocker_guy", "blocked_guy");

            const blockerDoc = await db.collection('accounts').doc("blocker_guy").get();
            const blockedDoc = await db.collection('accounts').doc("blocked_guy").get();
        
            const blockerData = blockerDoc.data();
            const blockedData = blockedDoc.data();

            assert(!blockerData!.blocked_by); 
            assert.deepEqual(blockerData!.blocked_users, ["blocked_guy"]); 

            assert(!blockedData!.blocked_users)
            assert.deepEqual(blockedData!.blocked_by, ["blocker_guy"]); 
        })

    })

    describe("Block User Typescript func", () => {
        let db: FirebaseFirestore.Firestore, test : FeaturesList;
        before(async ()=>{
            test = getTestFeatureList();
            db = admin.firestore();
            await db.collection('accounts').doc("blocker_guy").set({"name": "our blocker_guy"});
            await db.collection('activities').doc("blocked_activity").set({"name": "our blocked_activity"});
        })

        after(()=> { test.cleanup(); })

        it("Denormalizes data for an arbitrary blocker and blockee", async ()=>{
            await blocking.block('activity', "blocker_guy", "blocked_activity");

            const blockerDoc = await db.collection('accounts').doc("blocker_guy").get();
            const blockerData = blockerDoc.data();

            assert(!blockerData!.blocked_by); 
            assert.deepEqual(blockerData!.blocked_activities, ["blocked_activity"]); 
        })


    })
    
})

describe("IDs are properly taken from snapshots", () => {
    describe("Users are blocked with a created report", () => {
        let test: FeaturesList
    
        before(()=>{
            test = getTestFeatureList();
        })
    
        after(()=> {
            test.cleanup();
        })
    
        it("Uses the correct IDs to call the block user procecure", ()=>{
            const data = {
                "report_by_id": "reporter_user",
                "reported_user_id": "reported_user",
            }
            const newReport = test.firestore.makeDocumentSnapshot(data, 'user_report/test_report');
    
            const { actor_id, target_id } = blocking.getReportIds('report_by_id', 'reported_user_id', newReport);
            assert(actor_id === "reporter_user");
            assert(target_id === "reported_user")
        })
    })

    describe("Users are blocked with a created report", () => {
        let test: FeaturesList
    
        before(()=>{
            test = getTestFeatureList();
        })
    
        after(()=> {
            test.cleanup();
        })
    
        it("Uses the correct IDs to call the block user procecure", ()=>{
            const data = {
                "report_by_id": "reporter_user",
                "reported_activity_id": "reported_activity",
            }
            const newReport = test.firestore.makeDocumentSnapshot(data, 'user_report/test_report');
    
            const { actor_id, target_id } = blocking.getReportIds('report_by_id', 'reported_activity_id', newReport);
            assert(actor_id === "reporter_user");
            assert(target_id === "reported_activity")
        })
    })
})

describe('Remove myself from shared activities', () => {
    it('Filters based on members', async () => {
        const mockBlocking = new Blocking(mocks.firestoreMock)
        const me = 'me'
        const blockedUser = 'them'
        const spy = sinon.spy(mockBlocking, 'updateActivityOnBlock')
        await mockBlocking.removeMyselfFromSharedActivities(me, blockedUser)
        assert(spy.calledOnce)
    })
})

describe('Update activity on block', () => {
    it('Calls update on the given ref', async () => {
        const mockBlocking = new Blocking(mocks.firestoreMock)
        const spy = sinon.spy(mocks, 'activityUpdateSpy')
        const mockRef = mocks.generateRef("hello")
        // @ts-ignore
        await mockBlocking.updateActivityOnBlock(mockRef.ref, 'me')
        assert(spy.calledOnce)
    })
})
