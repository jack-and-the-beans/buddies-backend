import * as React from 'react';
import * as _ from 'lodash';
import memoizeOne from 'memoize-one'
import * as SentimentFinder from 'sentiment'
const sentiment = new SentimentFinder();


function Card(props: { kind: string, name: String | React.ReactNode, onBan(): void } & React.Props<any>) {
    return (
        <div className="card">
            <div className="top-area" style={{ marginBottom: 25, justifyContent: "left" }}>
                <h1 style={{width: "100%"}}>{props.name}</h1>
                <button style={{marginLeft: "unset", float: "right"}} onClick={props.onBan}>Delete {props.kind}</button>
            </div>
            {props.children}
        </div>
    );
}

function HelpText(props: { kind: string }) {
    return (
        <div style={{marginLeft: "auto", marginRight: "auto", marginTop: 25, maxWidth: 500}}>
            These are the <b>{props.kind}</b> reported.<br/><br/>
            <i>Sorted by number of reports, and then latest</i>
        </div>
    )
}

function SingleReport(props: { deleteReport(): void, by: { name: string, id: string }, allReports: Report[], allUserReports: Report[], message: string }) {
    let reportsBy = (getReportsdByUser(props.allReports)[props.by.id] || []).length;
    let reportsAgainst = (getUserReportsAgainstUser(props.allUserReports)[props.by.id] || []).length;
    let mySentiment = sentiment.analyze(props.message);
    let anger = mySentiment.comparative;

    // Make messages stand out more if:
    //  - they use a log of angry words
    //  - have a negative sentiment (our main concern)
    // Note: weighting is emperically derived
    let lightness = 75.0 + Math.pow(anger * 2, 3) - (mySentiment.negative.length / 5.0);
    lightness = Math.min(90, Math.max(40, lightness)); //cap at [40, 90]%
    
    return (
        <li data-anger={anger}>
            <i className="label">{ props.by.name } ({reportsBy} reports by, {reportsAgainst} reports against)</i>
            <button style={{float: "right"}} onClick={props.deleteReport}>Delete Report</button>
            <div style={{margin: "5px 0", padding: "5px 10px", borderLeft: "4px solid hsl(280, 20%, " + lightness + "%)", whiteSpace: "pre-wrap"}}>{ props.message }</div>
        </li>
    );
}

type ReportsAgainstProps = {
    onBan(): void
    deleteReport(report: Report): void
    imageUrl?: string
    allUserReports: Report[]
    allReports: Report[]
    against: string | React.ReactNode
    users: { [uid: string]: User }
    reports: Report[]
    kind: string
}

function ReportsAgainst(props: ReportsAgainstProps & React.Props<any>) {
    let reports = _(props.reports)
        .sortBy(report => report.timestamp.toMillis())
        .map((report, i) => 
            <SingleReport key={i}
                deleteReport={() => props.deleteReport(report)}
                allReports={props.allReports}
                allUserReports={props.allUserReports}
                by={props.users[report.report_by_id] || { name: "deleted user" }}
                message={report.message} />
        )
        .value();

    let image = props.imageUrl && <img src={props.imageUrl} style={{ borderRadius: "50%", width: 55, height: 55, float: "left", marginRight: 10, marginTop: 3 }} />;
    let header = (<div><div style={{marginBottom: 2}} className="label">Reports Against: </div>{image}{props.against}</div>)

    return (
        <Card name={header} kind={props.kind} onBan={props.onBan}>
            {props.children}
            <div className="field">
                <span className="label">Reports ({reports.length}):</span>
                <ul style={{margin: 0}}>{reports}</ul>
            </div>
        </Card>
    );
}

const geoNum = (n: number | undefined) => (n || 0).toFixed(3);

const latestReportTimestamp = (reports: Report[]) => Math.max.apply(Math, reports.map(r => r.timestamp.toMillis()))

const getActivityReportsAgainstUser: ((r: Report[]) => _.Dictionary<Report[] | undefined>) = 
    memoizeOne((userReports: Report[]) => _.keyBy(groupReports(userReports, r => r.report_by_id), r => r[0].reported_activity_id));
const getUserReportsAgainstUser: ((r: Report[]) => _.Dictionary<Report[] | undefined>) = 
    memoizeOne((userReports: Report[]) => _.keyBy(groupReports(userReports, r => r.report_by_id), r => r[0].reported_user_id));
const getReportsdByUser: ((r: Report[]) => _.Dictionary<Report[] | undefined>) =
    memoizeOne((userReports: Report[]) => _.keyBy(groupReports(userReports, r => r.report_by_id), r => r[0].report_by_id));

function groupReports<T>(reports: Report[], toGroupBy: (r: Report) => any): Report[][] {
    // Grab grouped reports sorted by 
    //  number of reports for this object
    //  and then by latestReportTimestamp.
    return _(reports)
        .groupBy(toGroupBy)
        .orderBy([r => r.length, latestReportTimestamp], ["desc", "desc"])
        .value() as Report[][];
}

type UserReportsProps = {
    allUsers: User[]
    allReports: Report[]
    userReports: Report[]
    onBan(uid: string): void
    deleteReport(report: Report): void
}

export function UserReports(props: UserReportsProps) {
    const reportee = (reports: Report[]) => reports[0].reported_user_id;
    const userMap = _.keyBy(props.allUsers, u => u.id);

    let nodes = groupReports(props.userReports, r => r.reported_user_id)
        .filter(reports => userMap[reportee(reports)])
        .map(reports => {
            let user = userMap[reportee(reports)];
            return (
                <ReportsAgainst kind="User"
                    deleteReport={props.deleteReport}
                    imageUrl={user.image_url}
                    allUserReports={props.userReports}
                    allReports={props.allReports}
                    onBan={() => props.onBan(reportee(reports))}
                    key={reportee(reports)}
                    against={<span>{user.name}<br/><span className="label">{user.bio}</span></span>}
                    users={userMap}
                    reports={reports}>
                    

                </ReportsAgainst>
            )
        });

    return (
        <div>
            <HelpText kind="users" />
            {nodes}
        </div>
    );
}

type ActivityReportProps = {
    allUsers: User[]
    allActivities: Activity[]
    allReports: Report[]
    userReports: Report[]
    activityReports: Report[]
    onBan(uid: string): void
    deleteReport(report: Report): void
}

export function ActivityReports(props: ActivityReportProps) {
    const reportee = (reports: Report[]) => reports[0].reported_activity_id
    const userMap = _.keyBy(props.allUsers, u => u.id);
    const activityMap = _.keyBy(props.allActivities, a => a.id);

    let reportsAgainstUser = getUserReportsAgainstUser(props.userReports);
    let activityReportsAgainstUser = getActivityReportsAgainstUser(props.activityReports);

    let nodes = groupReports(props.activityReports, r => r.reported_activity_id)
        .filter(reports => activityMap[reportee(reports)])
        .map(reports => {
            let activity = activityMap[reportee(reports)] || { title: "deleted activity" };
            let owner = userMap[activity.owner_id] || { name: "deleted user" };
            let reportedActivitiesByOwner = (_.values(_.groupBy(activityReportsAgainstUser[owner.id] || [], r => r.reported_activity_id)) || []).length

            return (
                <ReportsAgainst kind="Activity"
                    onBan={() => props.onBan(reportee(reports))}
                    deleteReport={props.deleteReport}
                    key={reportee(reports)}
                    allUserReports={props.userReports}
                    allReports={props.allReports}
                    against={activity.title}
                    users={userMap}
                    reports={reports}>
                        <div className="field">
                            <div className="label">Info:</div>
                            <ul style={{margin: 0}}>
                                <li><span className="label">Description: </span><span style={{fontSize: 13, whiteSpace: "pre-wrap"}}>{activity.description}</span></li>
                                <li><span className="label">Members: </span><b>{(activity.members || []).length}</b></li>
                                <li><span className="label">Topics: </span><b>{(activity.topic_ids || []).length}</b></li>
                                <li><span className="label">Location: </span> {activity.location_text} ({geoNum((activity.location || {}).latitude)}, {geoNum((activity.location || {}).longitude)})</li>
                            </ul>
                        </div>
                        <div className="field">
                            <div><span className="label">Created By: </span><b>{owner.name}</b></div>
                            <ul style={{margin:0}}>
                                <li><b>{(reportsAgainstUser[owner.id] || []).length}</b><span className="label"> reports of user</span></li>
                                <li><b>{reportedActivitiesByOwner}</b><span className="label"> activities created by this user have pending reports.</span></li>
                                <li><b>{(activityReportsAgainstUser[owner.id] || []).length}</b><span className="label"> total pending reports against activities created by this user.</span></li>
                            </ul>
                        </div>
                </ReportsAgainst>   
            )
        });
    
    return (
        <div>
            <HelpText kind="activities" />
            {nodes}
        </div>
    )
}