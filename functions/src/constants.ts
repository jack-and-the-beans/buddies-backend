import * as functions from 'firebase-functions'

export const USER_INDEX_NAME = 'BUD_USERS'
export const ACTIVITY_INDEX_NAME = 'BUD_ACTIVITIES'

export const ALGOLIA_APP_ID = functions.config().algolia ? functions.config().algolia.app_id : 'NOPE'
export const ALGOLIA_ADMIN_API_KEY = functions.config().algolia ? functions.config().algolia.api_key : 'NOPE'
export const ALGOLIA_SEARCH_API_KEY = functions.config().algolia ? functions.config().algolia.search_api_key : 'NOPE'
export const USER_SEARCH_RADIUS = 30000 // 30 km
