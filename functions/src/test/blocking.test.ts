import * as assert from 'assert';
import * as admin from 'firebase-admin';
import 'mocha';

import * as blocking from '../blocking';

const test = require('firebase-functions-test')({
    databaseURL: "https://beans-buddies-dev.firebaseio.com",
    storageBucket: "beans-buddies-dev.appspot.com",
    projectId: "beans-buddies-dev",
}, 'beans-buddies-dev.json.secret');

describe("Block User Typescript func", () => {
    let db: FirebaseFirestore.Firestore;
    before(async ()=>{
        db = admin.firestore();
        await db.collection('users').doc("blocker_guy").set({"name": "blocker_guy"});
        await db.collection('users').doc("blocked_guy").set({"name": "blocked_guy"});
    })

    after(() => {
        // db.collection('users').doc("blocker_guy").delete();
        // db.collection('users').doc("blocked_guy").delete();
        test.cleanup();
    });

    it("Blocking denormalizes for an arbitrary blocker and blockee", async ()=>{

        await blocking.blockUser("blocker_guy", "blocked_guy");

        const blockerDoc = await db.collection('users').doc("blocker_guy").get();
        const blockedDoc = await db.collection('users').doc("blocked_guy").get();
    
        const blockerData = blockerDoc.data();
        const blockedData = blockedDoc.data();


        assert(!blockerData!.blocked_by); 
        assert.deepEqual(blockerData!.blocked_users, ["blocked_guy"]); 

        assert(!blockedData!.blocked_users)
        assert.deepEqual(blockedData!.blocked_by, ["blocker_guy"]); 

    })

})

