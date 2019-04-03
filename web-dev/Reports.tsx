import * as React from 'react';
import * as _ from 'lodash';

function Card(props: { name: String | React.ReactNode, onBan(): void } & React.Props<any>) {
    return (
        <div className="card">
            <div className="top-area" style={{ justifyContent: "left" }}>
                <h1 style={{width: "100%"}}>{props.name}</h1>
                <button style={{marginLeft: "unset", float: "right"}} onClick={props.onBan}>Delete</button>
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

function SingleReport(props: { by: { name: string }, message: string }) {
    return (
        <li>
            <i className="label">{ props.by.name }</i>: <span>{ props.message }</span>
        </li>
    );
}

function ReportsAgainst(props: { onBan(): void, imageUrl?: string, against: string | React.ReactNode, users: { [uid: string]: User }, reports: Report[] }) {
    let reports = _(props.reports)
        .sortBy(report => report.timestamp.toMillis())
        .map((report, i) => <SingleReport key={i} by={props.users[report.report_by_id] || { name: "deleted" }} message={report.message} />)
        .value();

    let image = props.imageUrl && <img src={props.imageUrl} style={{ borderRadius: "50%", width: 55, height: 55, float: "left", marginRight: 10, marginTop: 3 }} />;
    let header = (<div><div style={{marginBottom: 2}} className="label">Reports Against: </div>{image}{props.against}</div>)

    return (
        <Card name={header} onBan={props.onBan}>
            <br/>
            <span className="label">Complaints:</span>
            <ul>{reports}</ul>
        </Card>
    );
}

const latestReportTimestamp = (reports: Report[]) => Math.max.apply(Math, reports.map(r => r.timestamp.toMillis()))

type UserReportsProps = {
    allUsers: User[]
    userReports: Report[]
    onBan(uid: string): void
}

export function UserReports(props: UserReportsProps) {
    const reportee = (reports: Report[]) => reports[0].reported_user_id
    const userMap = _.keyBy(props.allUsers, u => u.id);

    let nodes = _(props.userReports)
        .groupBy(r => r.reported_user_id)
        .orderBy(r => r.length, "desc")
        .orderBy(latestReportTimestamp, "desc")
        .filter((reports: Report[]) => userMap[reportee(reports)])
        .map((reports: Report[]) => {
            let user = userMap[reportee(reports)];
            return <ReportsAgainst
                imageUrl={user.image_url}
                onBan={() => props.onBan(reportee(reports))}
                key={reportee(reports)}
                against={<span>{user.name}<br/><span className="label">{user.bio}</span></span>}
                users={userMap}
                reports={reports} />
        })
        .value();

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
    activityReports: Report[]
    onBan(uid: string): void
}

export function ActivityReports(props: ActivityReportProps) {
    const reportee = (reports: Report[]) => reports[0].reported_activity_id
    const userMap = _.keyBy(props.allUsers, u => u.id);
    const activityMap = _.keyBy(props.allActivities, a => a.id);

    let nodes = _(props.activityReports)
        .groupBy(r => r.reported_activity_id)
        .orderBy(r => r.length, "desc")
        .orderBy(latestReportTimestamp, "desc")
        .filter((reports: Report[]) => activityMap[reportee(reports)])
        .map((reports: Report[]) => <ReportsAgainst onBan={() => props.onBan(reportee(reports))} key={reportee(reports)} against={activityMap[reportee(reports)].title} users={userMap} reports={reports} />)
        .value();
    
    return (
        <div>
            <HelpText kind="activities" />
            {nodes}
        </div>
    )
}