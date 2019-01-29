import * as functions from 'firebase-functions'

export const USER_INDEX_NAME = 'BUD_USERS'
export const ACTIVITY_INDEX_NAME = 'BUD_ACTIVITIES'

const { app_id, api_key, search_api_key } = functions.config().algolia
export const ALGOLIA_APP_ID = app_id
export const ALGOLIA_ADMIN_API_KEY = api_key
export const ALGOLIA_SEARCH_API_KEY = search_api_key
export const USER_SEARCH_RADIUS = 30000 // 30 km
