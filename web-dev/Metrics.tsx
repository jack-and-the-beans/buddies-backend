import * as React from 'react';
import * as _ from 'lodash';
import * as shortNumber from 'short-number';
import useLocalStorage from 'react-use-localstorage';

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

// Adapted from: https://stackoverflow.com/questions/1053843/get-the-element-with-the-highest-occurrence-in-an-array
function getMostCommonEl(arr: string[]): string | undefined {
    if(!arr.length)
        return undefined;
        
    var counts: { [key:string]: number } = {};
    var maxEl = arr[0], maxCount = 1;

    arr.forEach(el => {
        counts[el] = (counts[el] || 0) + 1;

        if(counts[el] > maxCount) {
            maxEl = el;
            maxCount = counts[el];
        }
    });
    
    return maxEl;
}

const avgNumTopics = (acts: Activity[]) => acts.reduce((count, act) => count + (act.topic_ids || []).length, 0)/acts.length;
const avgNumJoined = (acts: Activity[]) => acts.reduce((count, act) => count + (act.members||[]).length, 0)/acts.length;
const avgFavTopics = (users: User[]) => users.reduce((count, u) => count + (u.favorite_topics || []).length, 0)/users.length;

const topicNameById = (id: string | undefined, all: Topic[]) => (all.filter(t => t.id === id).pop() || { name: id }).name || "None";
const mostCommonTopic = (acts: Activity[]) => getMostCommonEl(_.flatMap(acts, a => a.topic_ids));

export function Metrics(props: MetricProps) {
    let [ daysAgoJSON, setDaysAgoJSON ] = useLocalStorage("beans/metrics/daysAgo", "7"); // Default to a week ago
    const setDaysAgo = (daysAgo: number) => setDaysAgoJSON(JSON.stringify(daysAgo));
    const daysAgo = parseInt(daysAgoJSON);

    let recentTimestamp = new Date();
    recentTimestamp.setDate(recentTimestamp.getDate() - daysAgo);
    recentTimestamp.getUTCSeconds()

    let newActivities = props.allActivities.filter(a => a.date_created && a.date_created.toDate() > recentTimestamp);
    let newUsers = props.allUsers.filter(u => u.date_joined.toDate() > recentTimestamp);

    return (
        <div>
            <div style={{marginLeft: "auto", marginRight: "auto", marginTop: 25, maxWidth: 500 }}>
                <div>Recent defined as the last {daysAgo} {daysAgo == 1 ? "day" : "days"}</div>
                <input type="range" min={1} max={60} onChange={r => setDaysAgo(parseInt(r.currentTarget.value))} defaultValue={daysAgo.toString()} />
            </div>
            <MetricCard name="Trends">
                <TextMetric value={topicNameById(mostCommonTopic(props.allActivities), props.allTopics)} kind="[All Time] Most common topic" />
                <TextMetric value={topicNameById(mostCommonTopic(newActivities), props.allTopics)} kind="[Recent] Most common topic" />
            </MetricCard>
            <MetricCard name="[All Time] Stats">
                <CountMetric value={props.allUsers.length} kind="users" />
                <CountMetric value={props.allActivities.length} kind="activities" />
                <CountMetric value={props.allActivities.length/props.allUsers.length} kind="avg activities created per user" />
                <CountMetric value={avgNumTopics(props.allActivities)} kind="avg topics per activity" />
                <CountMetric value={avgNumJoined(props.allActivities)} kind="avg joined users per activity" />
                <CountMetric value={avgFavTopics(props.allUsers)} kind="avg favorite topics per user" />
            </MetricCard>
            <MetricCard name="[Recent] Activities">
                <CountMetric value={newActivities.length} kind="new activities" />
                <CountMetric value={newActivities.length/props.allUsers.length} kind="avg new activities per user" />
                <CountMetric value={avgNumTopics(newActivities)} kind="avg topics in new activity" />
                <CountMetric value={avgNumJoined(newActivities)} kind="avg joined users per new activity" />
            </MetricCard>
            <MetricCard name="[Recent] Users Joined">
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
