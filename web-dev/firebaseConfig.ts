import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage'

// Export firebase to the window for easier init
window["firebase"] = firebase;

export const firestore = firebase.firestore
export const auth = firebase.auth
export const storage = firebase.storage