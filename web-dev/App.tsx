import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { store, State } from './Store';
import { Provider, connect } from 'react-redux';
import * as _ from 'lodash';
import * as AuthHandler from './AuthHandler';
import { EditTopics } from './EditTopics';
import { UserReports, ActivityReports } from './Reports';
import * as TopicService from './TopicService';
import { auth } from './firebaseConfig'
import { Metrics, Metrics__Loading } from './Metrics';
import * as ReportService from './ReportService';
import useLocalStorage from 'react-use-localstorage';

type AppProps = {
    isAuthorized: boolean
    isAdmin: boolean
    loading: boolean
    topics: Topic[]
    activities: Activity[]
    users: User[]
    userReports: Report[]
    activityReports: Report[]
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
    UserReports = 1,
    ActivityReports = 2,
}

class AppContent extends React.Component<AppProps & {mode: ContentMode, setMode(mode: ContentMode): void }> {
    private buttonFor(mode: ContentMode, name: string) {
        const click = () => this.props.setMode(mode);
        return <button type="button" onClick={click} className={this.props.mode === mode ? "selected" : ""}>{name}</button>
    }

    private renderBody() {
        switch(this.props.mode) {
            case ContentMode.Metrics:
                return <Metrics allTopics={this.props.topics} allActivities={this.props.activities} allUsers={this.props.users} />
            case ContentMode.Topics:
                return <EditTopics onCreateTopic={TopicService.createTopic} topics={this.props.topics} onDeleteTopic={TopicService.deleteTopic}/>
            case ContentMode.UserReports:
                return <UserReports onBan={ReportService.banUser} allUsers={this.props.users} userReports={this.props.userReports} />;
            case ContentMode.ActivityReports:
                return <ActivityReports onBan={ReportService.banActivity} allUsers={this.props.users} allActivities={this.props.activities} activityReports={this.props.activityReports} />;
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
                    {this.buttonFor(ContentMode.UserReports, "User Reports")}
                    {this.buttonFor(ContentMode.ActivityReports, "Activity Reports")}
                </div>

                {this.renderBody()}
            </div>
        );
    }
}

function TabStateApp(props: AppProps) {
    let [ mode, setMode ] = useLocalStorage("beans/tabBar", "-1");
    return <AppContent {...props} mode={JSON.parse(mode)} setMode={mode => setMode(JSON.stringify(mode))} />
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
                    <TabStateApp {...this.props} />
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
        userReports: state.userReports,
        activityReports: state.activityReports,
    };
}

export function renderIn(container: Element) {
	const ConnectedApp = connect(mapStateToProps)(App);

	ReactDOM.render((
		<Provider store={store}><ConnectedApp /></Provider>
    ), container);
}