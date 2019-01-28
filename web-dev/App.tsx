import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { store, State } from './Store';
import { Provider, connect } from 'react-redux';
import * as _ from 'lodash';
import * as firebase from 'firebase';
import FlipMove from 'react-flip-move';

type AppProps = {
    hasBeenOpenForMoreThan5Seconds: boolean // example
    isAuthorized: boolean
};

class App extends React.PureComponent<AppProps> {
   private getTimerSection() {
        if (this.props.hasBeenOpenForMoreThan5Seconds) {
            return <div>The app has been open for more than 5 seconds!</div>
        }

        return (
            <div>Wait for 5 seconds to pass...</div>
        );
    }

    render() {
        if (!this.props.isAuthorized)
            return null;

        return (
            <div>
                <div>UID: {firebase.auth().currentUser!.uid}</div>
                {this.getTimerSection()}
            </div>
        );
    }
}

function mapStateToProps(state: State): AppProps {
    return {
        hasBeenOpenForMoreThan5Seconds: state.hasBeenOpenForMoreThan5Seconds,
        isAuthorized: state.isAuthorized,
    }
}

export function renderIn(container: Element) {

	const ConnectedApp = connect(mapStateToProps)(App);

	ReactDOM.render((
		<Provider store={store}><ConnectedApp /></Provider>
    ), container);
}