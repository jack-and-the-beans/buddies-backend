import * as functions from 'firebase-functions'
import * as algoliasearch from 'algoliasearch'
import * as constants from './constants'
import * as admin from 'firebase-admin'
try { admin.initializeApp() } catch (e) {}

const algoliaClient = algoliasearch(constants.ALGOLIA_APP_ID, constants.ALGOLIA_SEARCH_API_KEY)

const settings = { timestampsInSnapshots: true }
admin.firestore().settings(settings)

// Export all cloud functions from this file:
export * from './blocking'

import Notifications from './notifications'
const notifications = new Notifications(admin.firestore(), algoliaClient, admin.messaging())
export const onActivityCreation = functions.firestore.document('activities/{activity_id}').onCreate(notifications.activityCreationHandler)
export const onActivityUsersChange = functions.firestore.document('activities/{activity_id}').onUpdate(notifications.onActivityUsersChanged)
export const onMessageCreation = functions.firestore.document('activities/{activity_id}/chat/{chatId}').onCreate(notifications.newMessageHandler)

import AlgoliaSync from './algoliaSync'
const algoliaSync = new AlgoliaSync(algoliaClient)
export const sendActivityDataToAlgolia = functions.firestore.document('activities/{activity_id}').onWrite(algoliaSync.activityDataHandler)
export const sendUserDataToAlgolia = functions.firestore.document('users/{user_id}').onWrite(algoliaSync.userDataHandler)

import UserManagement from './userManagement'
const userManagement = new UserManagement(admin.firestore(), admin.storage().bucket())
export const onUserDelete = functions.auth.user().onDelete(userManagement.onUserDelete)
