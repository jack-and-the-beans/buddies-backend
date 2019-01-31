
interface AlgoliaBase {
    objectID: string,
}
type AlgoliaGeoPoint = {
    lat: number,
    lng: number,
}
interface AlgoliaActivity extends AlgoliaBase {
    _geoloc: AlgoliaGeoPoint,
    title: string,
    description: string,
    start_time: Date,
    end_time: Date,
    topic_ids: string[],
}

interface AlgoliaUser extends AlgoliaBase {
    favorite_topics: string[],
    block_filter: string[], // array of UIDs of blocked and blocked by users
    should_send_activity_suggestion_notification: boolean,
    _geoloc: AlgoliaGeoPoint,
    notification_token: string,
}

interface Activity {
    members : string[]
    location : {
        latitude: number,
        longitude: number,
    },
    owner_id : string
    title : string
    description : string
    start_time : Date
    end_time : Date
    topic_ids : string[]
    date_created : Date
}

interface ChatMessage {
    message : string
    date_sent : Date
    sender : string
}