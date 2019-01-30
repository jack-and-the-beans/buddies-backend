import * as firebase_test from 'firebase-functions-test';

export function getTestFeatureList() { 
    return firebase_test({
        databaseURL: "https://beans-buddies-dev.firebaseio.com",
        storageBucket: "beans-buddies-dev.appspot.com",
        projectId: "beans-buddies-dev",
    }, 'beans-buddies-dev.json.secret');
}
