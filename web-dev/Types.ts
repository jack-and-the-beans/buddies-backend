type User = {
    image_url : string
    is_admin? : boolean
    uid : string
    name : string
    bio : string
    email? : string // Facebook doesn't always have email
    facebook_id? : string
    favorite_topics : string[]
    blocked_users : string[]
    blocked_activities : string[]
    blocked_by : string[]
    date_joined : Date
}

type Topic = {
    name : string
    image_url : string
}

type TopicToCreate = {
    imageFile: File | null
    name: string
}
