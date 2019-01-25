import { store, SetHasBeenOpenForMoreThan5Seconds, SetIsAuthorized } from './Store';
import * as firebase from 'firebase';
import * as App from './App'; 
import './style.scss';

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
    auth.signInAnonymously().then(watchValuesForRedux);
});
