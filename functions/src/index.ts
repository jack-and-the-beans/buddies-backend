import * as functions from 'firebase-functions'
import * as algoliasearch from 'algoliasearch'
import * as constants from './constants'
import * as admin from 'firebase-admin'
try { admin.initializeApp() } catch (e) {}

const settings = { timestampsInSnapshots: true }
admin.firestore().settings(settings)

// Export all cloud functions from this file:
import Blocking from './blocking'
const blocking = new Blocking(admin.firestore())
export const blockUserOnCall = functions.https.onCall(blocking.blockUserOnCall)
export const newReportedUser = functions.firestore.document('user_report/{reportId}').onCreate(blocking.newReportedUser)
export const newReportedActivity = functions.firestore.document('activity_report/{reportId}').onCreate(blocking.newReportedActivity)

import Notifications from './notifications'
const notifications = new Notifications(
  admin.firestore(),
  algoliasearch(constants.ALGOLIA_APP_ID, constants.ALGOLIA_SEARCH_API_KEY),
  admin.messaging()
)
export const onActivityCreation = functions.firestore.document('activities/{activity_id}').onCreate(notifications.activityCreationHandler)
export const onActivityUsersChange = functions.firestore.document('activities/{activity_id}').onUpdate(notifications.onActivityUsersChanged)
export const onMessageCreation = functions.firestore.document('activities/{activity_id}/chat/{chatId}').onCreate(notifications.newMessageHandler)

import AlgoliaSync from './algoliaSync'
const algoliaSync = new AlgoliaSync(
  algoliasearch(constants.ALGOLIA_APP_ID, constants.ALGOLIA_ADMIN_API_KEY)
)
export const sendActivityDataToAlgolia = functions.firestore.document('activities/{activity_id}').onWrite(algoliaSync.activityDataHandler)
export const sendUserDataToAlgolia = functions.firestore.document('accounts/{user_id}').onWrite(algoliaSync.userDataHandler)
export const onActivityDelete = functions.firestore.document('activities/{activity_id}').onDelete(algoliaSync.onActivityDelete)

import UserManagement from './userManagement'
const userManagement = new UserManagement(admin.firestore(), admin.storage().bucket(), admin.auth())
export const onUserDelete = functions.auth.user().onDelete(userManagement.onUserDelete)
export const onUserDocDelete = functions.firestore.document('accounts/{user_id}').onDelete(userManagement.onUserDocDelete)
export const onAccountChange = functions.firestore.document("accounts/{user_id}").onWrite(userManagement.onAccountChangePush)
