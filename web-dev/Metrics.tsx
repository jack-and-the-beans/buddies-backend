import * as React from 'react';
import * as _ from 'lodash';
import * as shortNumber from 'short-number';

function MetricCard__Loading() {
    return (
        <div className="card">
            <div className="load-block"></div>
            <div className="card-content load-block--large"></div>
        </div>
    );
}

function MetricCard(props: { name: String } & React.Props<any>) {
    return (
        <div className="card">
            <div className="top-area">
                <h1>{props.name}</h1>
            </div>
            {props.children}
        </div>
    );
}

function prettyNumber(value: number) {
    if (isNaN(value))
        return "0";
    else if (value % 1 == 0)
        return String(shortNumber(value)).toLowerCase();
    else 
        return value.toFixed(2);
}

function CountMetric(props: { value: number, kind: string }) {
    return (
        <div className="label field">
            <span style={{ fontWeight: "bold", fontSize: 25 }}>{ prettyNumber(props.value) }</span> {props.kind}
        </div>
    );
}

function TextMetric(props: { value: string, kind: string }) {
    return (
        <div className="field">
            <div className="label">{props.kind}</div>
            <span style={{ fontWeight: "bold", fontSize: 25 }}>{ props.value }</span>
        </div>
    );
}

type MetricProps = {
    allUsers: User[]
    allActivities: Activity[]
    allTopics: Topic[]
}

function getMostCommonEl<T>(arr: T[]): T | undefined {
    return arr.sort((a,b) =>
        arr.filter(v => v===a).length
        - arr.filter(v => v===b).length
    ).pop();
}

const avgNumTopics = (acts: Activity[]) => acts.reduce((count, act) => count + act.topic_ids.length, 0)/acts.length;
const avgNumJoined = (acts: Activity[]) => acts.reduce((count, act) => count + (act.members||[]).length, 0)/acts.length;
const avgFavTopics = (users: User[]) => users.reduce((count, u) => count + u.favorite_topics.length, 0)/users.length;

const topicNameById = (id: string | undefined, all: Topic[]) => (all.filter(t => t.id === id).pop() || { name: id }).name || "None";
const mostCommonTopic = (acts: Activity[]) => getMostCommonEl(_.flatMap(acts, a => a.topic_ids));

export function Metrics(props: MetricProps) {
    let lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.getUTCSeconds()

    let newActivities = props.allActivities.filter(a => a.date_created && a.date_created.toDate() > lastWeek);
    let newUsers = props.allUsers.filter(u => u.date_joined.toDate() > lastWeek);

    return (
        <div>

            <MetricCard name="Trends">
                <TextMetric value={topicNameById(mostCommonTopic(props.allActivities), props.allTopics)} kind="[All Time] Most common topic" />
                <TextMetric value={topicNameById(mostCommonTopic(newActivities), props.allTopics)} kind="[This Week] Most common topic" />
            </MetricCard>
            <MetricCard name="[All Time] Stats">
                <CountMetric value={props.allUsers.length} kind="users" />
                <CountMetric value={props.allActivities.length} kind="activities" />
                <CountMetric value={props.allActivities.length/props.allUsers.length} kind="avg activities created per user" />
                <CountMetric value={avgNumTopics(props.allActivities)} kind="avg topics per activity" />
                <CountMetric value={avgNumJoined(props.allActivities)} kind="avg joined users per activity" />
                <CountMetric value={avgFavTopics(props.allUsers)} kind="avg favorite topics per user" />
            </MetricCard>
            <MetricCard name="Activities Created This Week">
                <CountMetric value={newActivities.length} kind="new activities" />
                <CountMetric value={newActivities.length/props.allUsers.length} kind="avg new activities per user" />
                <CountMetric value={avgNumTopics(newActivities)} kind="avg topics in new activity" />
                <CountMetric value={avgNumJoined(newActivities)} kind="avg joined users per new activity" />
            </MetricCard>
            <MetricCard name="Users Joined this week">
                <CountMetric value={newUsers.length} kind="users" />
                <CountMetric value={avgFavTopics(newUsers)} kind="avg favorite topics per user" />
            </MetricCard>
        </div>
    );
}

export function Metrics__Loading() {
    return (
        <div>
            {_.times(5, n => <MetricCard__Loading key={n}/>)}
        </div>
    );
}