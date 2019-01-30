export const algoliaMock = (id: string, key: string) => ({
    initIndex: (name: string) => algoliaIndexMock,
})

export const algoliaIndexMock = {
    search: (query: any) => Promise.resolve({ hits: testUsers }),
    addObject: (data: any) => Promise.resolve(),
    deleteObject: (id: string) => Promise.resolve(),
    partialUpdateObject: (data: any) => Promise.resolve(),
}

export const adminMock = () => ({
    messaging: () => messagingMock
})

export const messagingMock = {
    send: (message: any) => Promise.resolve({})
}

export const testUsersNoteAndBlock: AlgoliaUser[] = [
    { // Remove because there is no token:
        objectID: '1',
        favorite_topics: ['x'],
        block_filter: ['a', 'block'],
        should_send_activity_suggestion_notification: true,
        _geoloc: {
            lat: 1,
            lng: 1,
        },
        notification_token: '',
    },
    { // Should stay:
        objectID: '2',
        favorite_topics: ['a'],
        block_filter: [],
        should_send_activity_suggestion_notification: true,
        _geoloc: {
            lat: 1,
            lng: 1,
        },
        notification_token: 'a',
    },
]
export const testUsersNoteAndBlockRes: AlgoliaUser[] = [
    { // Should stay:
        objectID: '2',
        favorite_topics: ['a'],
        block_filter: [],
        should_send_activity_suggestion_notification: true,
        _geoloc: {
            lat: 1,
            lng: 1,
        },
        notification_token: 'a',
    },
]

export const testUsersPref: AlgoliaUser[] = [
    { // Remove because preference is set to false:
        objectID: '4',
        favorite_topics: ['a'],
        block_filter: ['a'],
        should_send_activity_suggestion_notification: false,
        _geoloc: {
            lat: 1,
            lng: 1,
        },
        notification_token: 'c',
    },
    { // Keep because all data is there:
        objectID: '5',
        favorite_topics: ['a', 'b'],
        block_filter: ['a'],
        should_send_activity_suggestion_notification: true,
        _geoloc: {
            lat: 1,
            lng: 1,
        },
        notification_token: 'd',
    }
]
export const testUsersPrefRes: AlgoliaUser[] = [
    { // Keep because all data is there:
        objectID: '5',
        favorite_topics: ['a', 'b'],
        block_filter: ['a'],
        should_send_activity_suggestion_notification: true,
        _geoloc: {
            lat: 1,
            lng: 1,
        },
        notification_token: 'd',
    }
]

export const testUsers = testUsersNoteAndBlock.concat(testUsersPref)
export const testUsersRes = testUsersNoteAndBlockRes.concat(testUsersPrefRes)

// const testStartDate = new Date()
// const testEndDate = new Date()
export const testActivity = {
    activityId: 'xyz',
    ownerId: 'block',
    topicIds: ['a', 'b'],
    coords: {
        latitude: 1,
        longitutde: 1,
    },
}

export const testActivitySnap = {
    id: 'hello',
    data: () => ({
        owner_id: 'x',
        topic_ids: ['what'],
        location: { latitude: 1, longitude: 5 },
    })
}

export const testActivitySnapNull = {
    id: null,
    data: () => null
}

export const testStringArr1 = ['a', 'b', 'c']
export const testStringArr2 = ['b', 'a', 'c']
export const testStringArr3 = ['a', 'b', 'c']
export const testStringArr4 = ['a', 'b', 'd']

// Test data for algolia sync:
interface test extends AlgoliaBase {
    x: string,
}
const doc1 = {
    id: 'a',
    data: () => ({ x: 'a' })
}
const doc2 = {
    id: 'b',
    data: () => ({ x: 'b' })
}
export const syncTest = {
    compareFunc: (a: test, b: test) => a.x !== b.x,
    dataFunc: (doc: typeof doc1): test | null => {
        if (!doc) return null
        return {
            objectID: doc.id,
            x: doc.data().x
        }
    },
    equalChange: {
        after: { ...doc1 },
        before: { ...doc1}
    },
    diffChange: {
        after: { ...doc1 },
        before: { ...doc2 }
    },
    diffArg: {
        objectID: 'a',
        x: 'a'
    },
    newObject: {
        after: { ...doc1 },
    },
    newArg: {
        objectID: 'a',
        x: 'a'
    },
    deleteChange: {
        before: { ...doc1 },
    },
    deleteArg: 'a'
}

