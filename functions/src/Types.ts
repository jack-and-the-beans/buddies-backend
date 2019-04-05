
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
    end_time_num: number,
    start_time_num: number,
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
    banned_users: string[]
}

interface ChatMessage {
    message : string
    date_sent : Date
    sender : string
}

interface User {
    image_url: string,
    is_admin?: boolean,
    name: string,
    bio: string,
    email?: string,
    facebook_id?: string,
    favorite_topics: string[],
    blocked_users: string[],
    blocked_by: string[],
    date_joined: Date,
    location: {
        longitude: number,
        latitude: number,
    },
    notification_token: string,
    chat_read_at: {[activity_id: string]: Date},
    should_send_joined_activity_notification? : boolean,
    should_send_activity_suggestion_notification? : boolean,
}