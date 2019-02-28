import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import Refs from './firestoreRefs'
import * as _ from 'lodash';

interface Bucket {
  file(name?: string): {
    exists(): Promise<[boolean]>;
    delete(): Promise<any>;
  }
}

export default class UserManagement {
  constructor(public database: FirebaseFirestore.Firestore, public storageBucket: Bucket) {}

  onUserDelete = async (user: admin.auth.UserRecord, context: functions.EventContext) => {
    const uid = user.uid
    const publicRef = Refs(this.database).public_user(uid)
    const privateRef = Refs(this.database).account(uid)
    const pictureRef = this.storageBucket.file(`users/${uid}/profilePicture.jpg`)
  
    await privateRef.delete()
    await publicRef.delete()
    
    const exists = await pictureRef.exists()
    if (exists) {
      await pictureRef.delete()
    }
  }

  onAccountChangePush = async (change: functions.Change<FirebaseFirestore.DocumentSnapshot>) => {
    const keysToDuplicate = [
        "uid",
        "image",
        "image_url",
        "date_joined",
        "name",
        "bio",
        "favorite_topics",
    ];

    const uid = change.after.id;
    const accountData = change.after.data();
    if (!accountData) return

    const pairs = keysToDuplicate.map(key => [key, accountData[key]]);
    const userObject = _.fromPairs(pairs);

    return Refs(this.database).public_user(uid).set(userObject);
  }
}
