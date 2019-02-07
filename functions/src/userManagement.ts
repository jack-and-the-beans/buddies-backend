import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { storageBucketMock, firestoreMock } from './test/mocks'
import Refs from './firestoreRefs'
import * as _ from 'lodash'

try { admin.initializeApp() } catch (e) {}

const isTestMode = process.env.NODE_ENV === 'test'
const database = isTestMode ? firestoreMock : admin.firestore()
const storageBucket = isTestMode ? storageBucketMock : admin.storage().bucket()

export async function onUserDelete (user: admin.auth.UserRecord, context: functions.EventContext) {
  const uid = user.uid
  // @ts-ignore for the mock
  const databaseRef = Refs(database).user(uid)
  const pictureRef = storageBucket.file(`users/${uid}/profilePicture.jpg`)

  await databaseRef.delete()
  const exists = await pictureRef.exists()
  if (exists) {
    await pictureRef.delete()
  }
}