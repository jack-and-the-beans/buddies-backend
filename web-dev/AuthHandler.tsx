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
                        var userData: User = {
                            image_url: "TODO",
                            uid: authResult.user.uid,
                            name: authResult.user.name,
                            bio: "",
                            date_joined: new Date(),
                            favorite_topics: [],
                            blocked_users: [],
                            blocked_by: [],
                            blocked_activities: [],
                        };

                        firestore()
                            .collection("users")
                            .doc(authResult.user.uid)
                            .set(userData);
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
