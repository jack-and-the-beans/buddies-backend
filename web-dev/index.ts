import { store, SetUserData, SetIsAuthorized } from './Store';
import * as firebase from 'firebase';
import * as App from './App'; 
import './style.scss';

// Export firebase to the window for easier init
window["firebase"] = firebase;

function load(ref: firebase.firestore.DocumentReference, callback: (data?: any) => void) {
    ref.get().then(snapshot => callback(snapshot.data()));
    return ref.onSnapshot({
        next: snapshot => callback(snapshot.data())
    });
}

function watchValuesForRedux(): () => void {
    var currentUser = firebase.auth().currentUser;
    
    if (!currentUser) {
        store.dispatch(SetIsAuthorized({ isAuthorized: false }));
        return () => {};
    }
    
    store.dispatch(SetIsAuthorized({ isAuthorized: true }));

    var db = firebase.firestore();

    var cancelCallbacks = [
        load(
            db.collection("users").doc(currentUser.uid),
            (user?: User) => {
                if (user) {
                    store.dispatch(SetUserData({
                        isAdmin: user.is_admin || false
                    }));
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

    firebase.auth().onAuthStateChanged(function() {
        if (cancelLast)
            cancelLast();
        
        cancelLast = watchValuesForRedux();
      });
});

