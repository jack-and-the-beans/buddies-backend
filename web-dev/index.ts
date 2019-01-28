import { store, SetHasBeenOpenForMoreThan5Seconds, SetIsAuthorized } from './Store';
import * as firebase from 'firebase';
import * as App from './App'; 
import * as AuthHandler from './AuthHandler'; //TODO: this could be a good use for code splitting
import './style.scss';

// Export firebase to the window for easier init
window["firebase"] = firebase;

function watchValuesForRedux() {
    setTimeout(() => { // Example
        store.dispatch(SetHasBeenOpenForMoreThan5Seconds({ 
            hasBeenOpenForMoreThan5Seconds: true,
        }));
    }, 5000);

    store.dispatch(SetIsAuthorized({ isAuthorized: true }));
}

function renderApp() {
    const container = document.getElementById("content");
    App.renderIn(container!);
}

// Kick things off (auth & stuff)
document.addEventListener('DOMContentLoaded', function() {
    renderApp();

    // TODO: more secure auth
    const auth = firebase.auth();
    if (!auth.currentUser) {
        AuthHandler.handleLogin(watchValuesForRedux);
    }
    else {
        watchValuesForRedux();
    }
});

