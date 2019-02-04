import { store, SetUserData, SetTopics, SetIsAuthorized } from './Store';
import { auth, firestore } from './firebaseConfig'
import * as App from './App';
import './style.scss';

function loadCollection(ref: firebase.firestore.CollectionReference, callback: (data?: any[]) => void) {
    const useCallback = (snapshot: firebase.firestore.QuerySnapshot) => 
        callback(snapshot.docs.map(d => {
            const data = d.data()
            data.id = d.id
            return data
        }));

    return ref.onSnapshot(useCallback);
}

function loadDoc(ref: firebase.firestore.DocumentReference, callback: (data?: any) => void) {
    const useCallback = (snapshot: firebase.firestore.DocumentSnapshot) => 
        callback(snapshot.data());

    return ref.onSnapshot(useCallback);
}

function watchValuesForRedux(): () => void {
    var currentUser = auth().currentUser;
    
    if (!currentUser) {
        store.dispatch(SetIsAuthorized({ isAuthorized: false }));
        return () => {};
    }
    
    store.dispatch(SetIsAuthorized({ isAuthorized: true }));

    var cancelCallbacks = [
        loadDoc(
            firestore().collection("users").doc(currentUser.uid),
            (user?: User) => {
                if (user) {
                    store.dispatch(SetUserData({
                        isAdmin: user.is_admin || false
                    }));
                }
            }
        ),
        loadCollection(
            firestore().collection("topics"),
            (topics? : Topic[]) => {
                if (topics) {
                    store.dispatch(SetTopics({ topics }));
                }
            }
        ),
    ];

    return () => cancelCallbacks.forEach(cc => cc());
}

function renderApp() {
    const container = document.getElementById("content");
    App.renderIn(container!);
}

// Kick things off (auth & stuff)
document.addEventListener('DOMContentLoaded', function() {
    renderApp();

    var cancelLast: (() => void)| null = null;

    auth().onAuthStateChanged(function() {
        if (cancelLast)
            cancelLast();
        
        cancelLast = watchValuesForRedux();
      });
});

