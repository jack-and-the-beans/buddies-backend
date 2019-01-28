import * as  firebase from 'firebase';
import * as firebaseui from 'firebaseui';

export function handleLogin(callback: () => void) {
    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());

    // Add the auth container
    var container = document.createElement("div");
    document.body.appendChild(container);

    // Add the style tag to the body
    var style = document.createElement("link");
    style.setAttribute("href", "https://cdn.firebase.com/libs/firebaseui/3.5.2/firebaseui.css");
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("type", "text/css");
    document.body.appendChild(style);

    ui.start(container, {
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, __) {
                console.log("authResult", authResult);
                container.style.display = "none";
                document.body.removeChild(style);
                callback();
                return false;
            },
        },
        signInOptions: [
          {
            provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
            scopes: ['email'],
          },
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
        ]
      });
}
