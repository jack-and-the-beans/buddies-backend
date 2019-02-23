import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { store, State } from './Store';
import { Provider, connect } from 'react-redux';
import * as _ from 'lodash';
import * as AuthHandler from './AuthHandler';
import { EditTopics, EditTopics__Loading } from './EditTopics';
import * as TopicService from './TopicService';
import { auth } from './firebaseConfig'
import { Metrics, Metrics__Loading } from './Metrics';

type AppProps = {
    isAuthorized: boolean
    isAdmin: boolean
    loading: boolean
    topics: Topic[]
    activities: Activity[]
    users: User[]
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
    Metrics = -1,
    Topics = 0,
    Reports = 1,
}

class AppContent extends React.Component<AppProps, {mode: ContentMode}> {
    state = {
        mode: ContentMode.Metrics
    }

    private buttonFor(mode: ContentMode, name: string) {
        const click = () => this.setState({ mode });
        return <button type="button" onClick={click} className={this.state.mode === mode ? "selected" : ""}>{name}</button>
    }

    private renderBody() {
        switch(this.state.mode) {
            case ContentMode.Metrics:
                return <Metrics allTopics={this.props.topics} allActivities={this.props.activities} allUsers={this.props.users} />
            case ContentMode.Topics:
                return <EditTopics onCreateTopic={TopicService.createTopic} topics={this.props.topics} onDeleteTopic={TopicService.deleteTopic}/>
            case ContentMode.Reports:
                return <div>Not Implemented</div>;
        }
    }

    render() {
        if (!this.props.isAuthorized) 
            return (<AuthHandler.Authorizer />);

        if (this.props.loading) {
            <Metrics__Loading />
        }

        if (!this.props.isAdmin)
            return (
                <div className="card">
                    <div>Sorry, it doesn't look like you're an admin :(</div>
                    <div>UID: {auth().currentUser!.uid}</div>
                </div>
            );

        return (
            <div>
                <div className="button-group" style={{ textAlign: "center" }}>
                    {this.buttonFor(ContentMode.Metrics, "Metrics")}
                    {this.buttonFor(ContentMode.Topics, "Topics")}
                    {this.buttonFor(ContentMode.Reports, "Reports")}
                </div>

                {this.renderBody()}
            </div>
        );
    }
}

class App extends React.PureComponent<AppProps> {
    render() {
        if (this.props.loading) {
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
        loading: state.loading.app,
        topics: state.topics,
        activities: state.activities,
        users: state.users,
    };
}

export function renderIn(container: Element) {
	const ConnectedApp = connect(mapStateToProps)(App);

	ReactDOM.render((
		<Provider store={store}><ConnectedApp /></Provider>
    ), container);
}