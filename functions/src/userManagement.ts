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
  constructor(public database: FirebaseFirestore.Firestore, public storageBucket: Bucket, public auth: admin.auth.Auth) {}

  onUserDelete = async (user: admin.auth.UserRecord, context: functions.EventContext) => {
    const uid = user.uid
    const privateRef = Refs(this.database).account(uid)
    await privateRef.delete()
  }

  onUserDocDelete = async (snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext) => {
    const uid = snapshot.id
    await this.deletePublicAccount(uid)
    try {
      await this.deleteUserPicture(uid)
    } catch (e) {
      console.log(`Did not delete picture: ${e.message}`)
    }

    this.auth.getUser(uid)
      .then(() => this.auth.deleteUser(uid))
      .catch(e => console.log(`Could not delete the user account: ${e.message}`))
  }

  deletePublicAccount = async (uid: string) => {
    const publicRef = Refs(this.database).public_user(uid)
    await publicRef.delete()
  }

  deleteUserPicture = async (uid: string) => {
    const pictureRef = this.storageBucket.file(`users/${uid}/profilePicture.jpg`)
    const exists = await pictureRef.exists()
    if (exists) {
      await pictureRef.delete()
    }
  }

  onAccountChangePush = async (change: functions.Change<FirebaseFirestore.DocumentSnapshot>) => {
    const keysToDuplicate = [
      "uid",
      "image_url",
      "image_version",
      "date_joined",
      "name",
      "bio",
      "favorite_topics",
    ];

    const uid = change.after.id;
    const ref = Refs(this.database).public_user(uid);
    const accountData = change.after.data();
    if (!accountData || !change.after.exists) {
      await ref.delete();
      return;
    }

    // Defaults
    accountData.uid = uid
    accountData.image_version = accountData.image_version || 0

    // Sanity Check!
    keysToDuplicate.forEach(key => {
      if (_.isUndefined(accountData[key]))
        throw new Error(`Error: KEY=${key} not found on UID=${uid}`);
    });

    const pairs = keysToDuplicate.map(key => [key, accountData[key]]);
    const newValue = _.fromPairs(pairs);

    const oldValueSnap = await ref.get();
    const oldValue = oldValueSnap.data();

    if (!_.isEqual(oldValue, newValue)) {
      await ref.set(newValue);
    }
  }
}
