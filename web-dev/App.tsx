import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { store, State } from './Store';
import { Provider, connect } from 'react-redux';
import * as _ from 'lodash';
import * as firebase from 'firebase';
import * as AuthHandler from './AuthHandler';
import FlipMove from 'react-flip-move';

type AppProps = {
    isAuthorized: boolean
    isAdmin: boolean
};

function AppHeader(props: { isAuthorized: boolean }) {
    return (
        <header>
            <h1>Buddies Admin Portal</h1>
            {
                props.isAuthorized
                ? <button onClick={AuthHandler.signOut}>Sign-Out</button>
                : null
            }
        </header>
    );
}

function AppContent(props: AppProps) {
    if (!props.isAuthorized) 
        return (<AuthHandler.Authorizer />);

    if (!props.isAdmin)
        return (
            <div>
                <div>Sorry, it doesn't look like you're an admin :(</div>
                <div>UID: {firebase.auth().currentUser!.uid}</div>
            </div>
        );

    return (
        <div>
            <div>You're logged in as an admin.</div>
            <div>UID: {firebase.auth().currentUser!.uid}</div>
        </div>
    );
}

class App extends React.PureComponent<AppProps> {
    render() {
        return (
            <div>
                <AppHeader isAuthorized={this.props.isAuthorized} />
                <div className="content">
                    <AppContent {...this.props} />
                </div>
            </div>
        );
    }
}

function mapStateToProps(state: State): AppProps {
    return {
        isAuthorized: state.user.isAuthorized,
        isAdmin: state.user.isAdmin,
    }
}

export function renderIn(container: Element) {

	const ConnectedApp = connect(mapStateToProps)(App);

	ReactDOM.render((
		<Provider store={store}><ConnectedApp /></Provider>
    ), container);
}