import * as admin from 'firebase-admin';
try { admin.initializeApp() } catch (e) {}

const settings = { timestampsInSnapshots: true }
admin.firestore().settings(settings)

// Export all cloud functions from this file:
export * from './blocking'

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
