import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { store, State, LoadingInfo } from './Store';
import { Provider, connect } from 'react-redux';
import * as _ from 'lodash';
import * as firebase from 'firebase';
import * as AuthHandler from './AuthHandler';
import { EditTopics, EditTopics__Loading } from './EditTopics';
import * as TopicService from './TopicService';

type AppProps = {
    isAuthorized: boolean
    isAdmin: boolean
    loading: LoadingInfo
    topics: Topic[]
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

enum ContentMode {
    Topics = 0,
    EXAMPLE_OTHER = 1,
}

class AppContent extends React.Component<AppProps, {mode: ContentMode}> {
    state = {
        mode: ContentMode.Topics
    }

    private buttonFor(mode: ContentMode, name: string) {
        <button type="button" className={this.state.mode === mode ? "selected" : ""}>{name}</button>
    }

    private renderBody() {
        switch(this.state.mode) {
            case ContentMode.Topics:
                return <EditTopics onCreateTopic={TopicService.createTopic} topics={this.props.topics} />
            case ContentMode.EXAMPLE_OTHER:
                return <div>Example</div>;
        }
    }

    render() {
        if (!this.props.isAuthorized) 
            return (<AuthHandler.Authorizer />);

        if (this.props.loading.user || this.props.loading.topics) {
            <EditTopics__Loading />
        }

        if (!this.props.isAdmin)
            return (
                <div className="card">
                    <div>Sorry, it doesn't look like you're an admin :(</div>
                    <div>UID: {firebase.auth().currentUser!.uid}</div>
                </div>
            );

        return (
            <div>
                <div className="button-group" style={{ textAlign: "center" }}>
                    {this.buttonFor(ContentMode.Topics, "Topics")}
                    {this.buttonFor(ContentMode.EXAMPLE_OTHER, "EXAMPLE - Other")}
                </div>
                
                {this.renderBody()}
            </div>
        );
    }
}

class App extends React.PureComponent<AppProps> {
    render() {
        if (this.props.loading.app) {
            return <AppHeader isAuthorized={false} />
        }

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
        loading: state.loading,
        topics: state.topics,
    };
}

export function renderIn(container: Element) {

	const ConnectedApp = connect(mapStateToProps)(App);

	ReactDOM.render((
		<Provider store={store}><ConnectedApp /></Provider>
    ), container);
}