export const messagingMock = {
    send: (message: any) => Promise.resolve({})
}

export const adminMock = () => ({
    messaging: () => messagingMock
})

export const authMock = {
    getUser: (uid: string) => Promise.resolve(),
    deleteUser: (uid: string) => Promise.resolve()
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

// Mock Algolia (search returns test users)
export const algoliaIndexMock = {
    search: (query: any) => Promise.resolve({ hits: testUsers }),
    addObject: (data: any) => Promise.resolve(),
    deleteObject: (id: string) => Promise.resolve(),
    partialUpdateObject: (data: any) => Promise.resolve(),
}

export const algoliaMock = () => ({
    initIndex: (name: string) => algoliaIndexMock,
})

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

export const mockActivity = {
    default: {
        location : {
            latitude: 10,
            longitude: 10.5
        },
        members : ['bob', 'alice', 'mallory', 'linux'],
        owner_id : ['alice'],
        title : 'Security Meetup',
        description : 'We\'ll do security!',
        start_time : new Date(),
        end_time : new Date(),
        topic_ids : ['security'],
        date_created : new Date(),
    },
    another_act: {
        location : {
            latitude: 10,
            longitude: 10.5
        },
        members : ['bob', 'them'],
        owner_id : ['alice'],
        title : 'Security Meetup',
        description : 'We\'ll do security!',
        start_time : new Date(),
        end_time : new Date(),
        topic_ids : ['security'],
        date_created : new Date(),
    }
}

export const mockUsers = {
    bob: {
        notification_token: 'bob_t',
        name: 'BOB THE BUILDER',
    },
    alice: {
        notification_token: 'alice_t',
    },
    mallory: {
        notification_token: 'mallory_t'
    },
    steven: { // Does not have notification token
        name: 'steven'
    },
    linux: { // Does not have notification token
        notification_token: ''
    },
    ste5en: {
        notification_token: 10
    },
    guy: {
        should_send_joined_activity_notification: false,
        notification_token: 'guy_t',
    },
    guy2: {
        should_send_joined_activity_notification: true,
        notification_token: 'guy_2',
    }
}

export const storageBucketMock = {
    file: (path: String) => ({
         // We can pass 'not_exist' as the UID to test if a file exists:
        exists: () => Promise.resolve(path.split('/').indexOf('not_exists') === -1),
        delete: async () => { exports.spyOnMe2(); return true }
    })
}

export const firestoreMock: FirebaseFirestore.Firestore = ({
    collection: (id: string) => {
        if (id === 'activities') {
            return collectionGenerator(mockActivity)
        } else if (id === 'users' || id === 'accounts') { 
            // just mock the public users and private data the same. 
            return collectionGenerator(mockUsers)
        } else {
            return null
        }
    }
}) as any as FirebaseFirestore.Firestore

// These are just for spying:
export const spyOnMe1 = () => 1
export const spyOnMe2 = () => 2

function collectionGenerator(data: {[id: string]: Object}) {
    return {
        doc: (id: string) => ({
            get: () => {
                const exists = !!data[id]
                const res = exists ? data[id] : data['default']
                return Promise.resolve({
                    exists,
                    data: () => res
                })
            },
            collection: (i: string) => ({
                add: (d: any) => Promise.resolve(d)
            }),
            delete: async () => { exports.spyOnMe1(); return true }
        }),
        add: (d: any) => Promise.resolve(d),
        where: (query1: string, query2: string, info: string) => ({
            get: () => Promise.resolve({ docs: [
                generateRef(mockActivity.another_act),
                generateRef(mockActivity.default)
            ] })
        })
    }
}

export const activityUpdateSpy = (args: any) => undefined
export function generateRef( data: any ) {
    return {
        data: () => data,
        ref: {
            update: (args: any) => Promise.resolve(exports.activityUpdateSpy(args))
        }
    }
}

export const msgMock = {
    snap: {
        data: () => ({
            message: 'Hello there',
            sender: 'bob',
            date_sent: new Date(),
        })
    },
    context: {params: {activity_id: 'hello'}}
}