import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Refs from './firestoreRefs'

interface Bucket {
  file(name?: string): {
    exists(): Promise<[boolean]>;
    delete(): Promise<any>;
  }
}

export default class UserManagement {
  database: FirebaseFirestore.Firestore
  storageBucket: Bucket

  constructor(database: FirebaseFirestore.Firestore, bucket: Bucket) {
      this.database = database
      this.storageBucket = bucket
  }

  async onUserDelete (user: admin.auth.UserRecord, context: functions.EventContext) {
    const uid = user.uid
    const databaseRef = Refs(this.database).user(uid)
    const pictureRef = this.storageBucket.file(`users/${uid}/profilePicture.jpg`)
  
    await databaseRef.delete()
    const exists = await pictureRef.exists()
    if (exists) {
      await pictureRef.delete()
    }
  }
}
