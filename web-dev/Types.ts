type User = {
    image_url : string
    is_admin? : boolean
    id : string
    name : string
    bio : string
    email? : string // Facebook doesn't always have email
    facebook_id? : string
    favorite_topics : string[]
    blocked_users : string[]
    blocked_activities : string[]
    blocked_by : string[]
    date_joined : firebase.firestore.Timestamp
}

type Activity = {
    id: string
    title: string
    description: string
    owner_id: string
    topic_ids: string[]
    members?: string[]
    date_created?: firebase.firestore.Timestamp
}

type Topic = {
    name : string
    image_url : string
    id : string
}

type TopicToCreate = {
    imageFile: File | null
    name: string
}

type Report = {
    message: string
    report_by_id: string
    timestamp: firebase.firestore.Timestamp
    id: string
    // One of the other exists
    reported_activity_id: string
    reported_user_id: string
}