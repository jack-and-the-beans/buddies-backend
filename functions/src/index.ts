import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin';
try { admin.initializeApp() } catch (e) {}

const settings = { timestampsInSnapshots: true }
admin.firestore().settings(settings)

// Export all cloud functions from this file:
export * from './blocking'

import * as notifications from './notifications'
export const onActivityCreation = functions.firestore.document('activities/{activity_id}').onCreate(notifications.activityCreationHandler)
export const onMessageCreation = functions.firestore.document('activities/{activity_id}/chat/{chatId}').onCreate(notifications.newMessageHandler)

import * as algoliaSync from './algoliaSync'
export const sendActivityDataToAlgolia = functions.firestore.document('activities/{activity_id}').onWrite(algoliaSync.activityDataHandler)
export const sendUserDataToAlgolia = functions.firestore.document('users/{user_id}').onWrite(algoliaSync.userDataHandler)
