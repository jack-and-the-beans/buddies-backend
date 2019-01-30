import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin';
try { admin.initializeApp() } catch (e) {}

const settings = { timestampsInSnapshots: true }
admin.firestore().settings(settings)

// Export all cloud functions from this file:
export * from './blocking'

import * as notifications from './notifications'
export const onActivityCreation = functions.firestore.document('activities/{activityId}').onCreate(notifications.activityCreationHandler)

import * as algoliaSync from './algoliaSync'
export const sendActivityDataToAlgolia = functions.firestore.document('activities/{activity_id}').onWrite(algoliaSync.activityDataHandler)
export const sendUserDataToAlgolia = functions.firestore.document('users/{user_id}').onWrite(algoliaSync.userDataHandler)
