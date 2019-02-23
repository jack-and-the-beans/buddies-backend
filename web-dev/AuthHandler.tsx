import * as React from 'react';
import * as firebaseui from 'firebaseui';
import { auth, firestore } from './firebaseConfig'
import { once } from 'lodash';

const uiInstance = once(() => new firebaseui.auth.AuthUI(auth()))

export class Authorizer extends React.Component<{}> {
    private container: HTMLElement | null = null;
    
    shouldComponentUpdate() {
        return false;
    }

    componentDidMount() {
        if (!this.container)
            return;

        auth().setPersistence("local");
        uiInstance().start(this.container, {
            callbacks: {
                signInSuccessWithAuthResult: function (authResult) {
                    if (authResult.additionalUserInfo.isNewUser) {
                        let msg = "Creating a new account from admin portal is not allowed, please sign up in app first!"
                        alert(msg);
                        throw new Error(msg);
                    }

                    return false;
                },
            },
            signInOptions: [
                {
                    provider: auth.FacebookAuthProvider.PROVIDER_ID,
                    scopes: ['email'],
                },
                auth.EmailAuthProvider.PROVIDER_ID,
            ]
          });
    }

    componentWillUnmount() {
        if (!this.container)
            return;
        
        uiInstance().reset();
    }

    render() {
        return (
            <div>
                <div className="help-msg">Sign-in as a Buddies Admin</div>
                <div ref={c => this.container = c}></div>
                <link href="https://cdn.firebase.com/libs/firebaseui/3.5.2/firebaseui.css" rel="stylesheet" type="text/css" />
            </div>
        );
    }
}

export function signOut() {
    auth().signOut();
}
