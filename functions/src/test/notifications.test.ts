import * as assert from 'assert'
import * as sinon from 'sinon'
import * as mocks from './mocks'
import 'mocha'

import Notifications from '../notifications'
// @ts-ignore
const notifications = new Notifications(mocks.firestoreMock, mocks.algoliaMock(), mocks.messagingMock)

// NOTE: The `@ts-ignore` statements in this file are because much of the data
// does not fit the shape of the expected data. This is what we want, because
// we're trying to test the edge cases where the data doesn't fit what's expected.
describe('Notifications', () => {
    describe('Activity creation handler', () => {
        it('Gets activity data based on the data changed', async () => {
            const dataSpy = sinon.spy(notifications, 'getActivityData')
            // @ts-ignore
            await notifications.activityCreationHandler(mocks.testActivitySnap, {})
            assert(dataSpy.calledOnce)
        })
    
        it('Returns early if there is no data', async () => {
            // @ts-ignore
            const res = await notifications.activityCreationHandler(mocks.testActivitySnapNull, {})
            assert.equal(res, -1)
        })
    
        it('Calls the notification service', async () => {
            const notificationSpy = sinon.spy(notifications, 'sendUsersActivityNotification')
            // @ts-ignore
            await notifications.activityCreationHandler(mocks.testActivitySnap, {})
            assert(notificationSpy.calledOnce)
        })
    })
    
    describe('Activity creation notification', () => {
    
        it('Searches for nearby users', async () => {
            const searchIndex = mocks.algoliaIndexMock
            const searchSpy = sinon.spy(searchIndex, 'search')
            // @ts-ignore
            await notifications.sendUsersActivityNotification(mocks.testActivity, searchIndex, mocks.messagingMock)
            assert(searchSpy.calledOnce)
        })
    
        // Since the algolia mock returns `testUsers`, we know that a filter should be
        // applied which returns `testUsersRes`. We want to make sure that the notification
        // was sent exactly the number of times as there are users in `testUsersRes`.
        it('Sends a notification to each user per the filter', async () => {
            const msgMock = mocks.messagingMock
            const msgSpy = sinon.spy(mocks.messagingMock, 'send')
            // @ts-ignore
            await notifications.sendUsersActivityNotification(mocks.testActivity, mocks.algoliaIndexMock, msgMock)
            assert.equal(msgSpy.callCount, mocks.testUsersRes.length)
        })
    
    })
    
    describe('Notification user Filter', () => {
        it('Removes users who do not have a notification token', () => {
            const testData = mocks.testUsersNoteAndBlock
            const res = notifications.getUsersForNotification(testData, 'a')
            assert.deepEqual(res, mocks.testUsersNoteAndBlockRes)
        })
        it('Removes users who are blocked or blocked by the activity owner', () => {
            const testData = mocks.testUsersNoteAndBlock
            const res = notifications.getUsersForNotification(testData, 'block')
            assert.deepEqual(res, mocks.testUsersNoteAndBlockRes)
        })
        it('Removes users who have their preference set to false', () => {
            const testData = mocks.testUsersPref
            const res = notifications.getUsersForNotification(testData, 'block')
            assert.deepEqual(res, mocks.testUsersPrefRes)
        })
        it('Returns an empty array if no data is given', () => {
            const testData: AlgoliaUser[] = []
            const res = notifications.getUsersForNotification(testData, 'block')
            assert.deepEqual(res, []) 
        })
    })
    
    describe('Topic Filter Creator', () => {
        it('Returns an empty string when no topics are given', () => {
            const topics: string[] = []
            assert.equal(notifications.getTopicFilter(topics), '')
        })
    
        it('Returns a valid filter string when an even number of topics are given', () => {
            const topics: string[] = ['x', 'y']
            const filter = 'favorite_topics:x OR favorite_topics:y'
            assert.equal(notifications.getTopicFilter(topics), filter)
        })
    
        it('Returns a valid filter string when an odd number of topics are given', () => {
            const topics: string[] = ['x', 'y', 'z']
            const filter = 'favorite_topics:x OR favorite_topics:y OR favorite_topics:z'
            assert.equal(notifications.getTopicFilter(topics), filter)
        })
    })
    
    describe('Notification Generator Function', () => {
        it('Adds the notification token to the message', () => {
            const testToken = 'xyz'
            const res = notifications.createActivityNotification(testToken, 'foo')
            // @ts-ignore:
            assert.deepEqual(testToken, res.token)
        })
    
        it('Adds the activity ID to data', () => {
            const testId = 'xyz'
            const res = notifications.createActivityNotification('foo', testId)
            // @ts-ignore:
            assert.deepEqual(testId, res.data.activity_id)
        })
    })
    
    describe('Activity Data Generator Function', () => {
        it('Returns null if it is given null values', () => {
            // @ts-ignore:
            const res1 = notifications.getActivityData(mocks.testActivitySnapNull)
            assert.equal(res1, null)
    
            const test2 = {
                id: 'x',
                data: () => ({
                    topic_ids: [],
                    location: {},
                })
            }
            // @ts-ignore:
            const res2 = notifications.getActivityData(test2)
            assert.equal(res2, null)
    
            const test3 = {
                id: null,
                data: () => ({})
            }
            // @ts-ignore:
            const res3 = notifications.getActivityData(test3)
            assert.equal(res3, null)
    
            const test4 = {
                id: 'x',
                data: () => ({
                    ownerId: 'x',
                    coords: {}
                })
            }
            // @ts-ignore:
            const res4 = notifications.getActivityData(test4)
            assert.equal(res4, null)
        
            const test5 = {
                id: 'x',
                data: () => ({
                    ownerId: 'x',
                    topicIds: [],
                })
            }
            // @ts-ignore:
            const res5 = notifications.getActivityData(test5)
            assert.equal(res5, null)
        })
    
        it('Returns the correct variables if they exist', () => {
            // @ts-ignore:
            const res = notifications.getActivityData(mocks.testActivitySnap)
            assert.deepEqual(res, {
                activityId: 'hello',
                ownerId: 'x',
                topicIds: ['what'],
                coords: { latitude: 1, longitude: 5 },
            })
        })
    })
    
    describe('New Message Handler', () => {
        beforeEach(() => {
            // @ts-ignore
            mocks.messagingMock.send.restore()
        })
        it('Sends a notification to all users with valid notification tokens excluding the message sender', async () => {
            const resTokens = ['alice_t', 'mallory_t'].sort().join(',')
            const spy = sinon.spy(mocks.messagingMock, 'send')
            // @ts-ignore
            await notifications.newMessageHandler(mocks.msgMock.snap, mocks.msgMock.context)
            // Gets the calls, messages, then tokens from the messages:
            const calledTokens = spy.getCalls().map(call => call.args[0]).map(msg => msg.token).sort().join(',')
            assert.equal(resTokens, calledTokens)
        })
    })

    describe('Get notification tokens from activity', () => {
        it('Gets the user tokens from Firestore', async () => {
            const userIds = ['bob', 'alice', 'mallory']
            const senderId = 'bob'
            const db = mocks.firestoreMock
            const collectionSpy = sinon.spy(db, 'collection')
            // @ts-ignore because our mock is fine
            const res = await notifications.getTokensForChatNotification(userIds, senderId, db)
            assert(collectionSpy.calledTwice)
            assert(collectionSpy.calledWithExactly('users'))
        })
        it('Excludes the sender\'s token', async () => {
            const userIds = ['bob', 'alice', 'mallory']
            const senderId = 'bob'
            const db = mocks.firestoreMock
            // @ts-ignore because our mock is fine
            const res = await notifications.getTokensForChatNotification(userIds, senderId, db)
            assert.deepEqual(res, ['alice_t', 'mallory_t'])
        })
        it('Excludes invalid tokens', async () => {
            const userIds = ['bob', 'alice', 'mallory', 'steven', 'linux', 'ste5en']
            const senderId = 'bob'
            const db = mocks.firestoreMock
            // @ts-ignore because our mock is fine
            const res = await notifications.getTokensForChatNotification(userIds, senderId, db)
            assert.deepEqual(res, ['alice_t', 'mallory_t'])
        })
        it('Excludes users who do not exist', async () => {
            const userIds = ['bob', 'alice', 'not_existis']
            const senderId = 'bob'
            const db = mocks.firestoreMock
            // @ts-ignore because our mock is fine
            const res = await notifications.getTokensForChatNotification(userIds, senderId, db)
            assert.deepEqual(res, ['alice_t'])
        })
        it('Returns unique tokens', async () => {
            const userIds = ['bob', 'alice', 'alice', 'alice', 'bob']
            const senderId = 'mallory'
            const db = mocks.firestoreMock
            // @ts-ignore because our mock is fine
            const res = await notifications.getTokensForChatNotification(userIds, senderId, db)
            assert.deepEqual(res, ['bob_t', 'alice_t'])
        })
        it('Excludes users who have turned off activity detail notifications', async () => {
            const userIds = ['alice', 'guy', 'bob'] // Guy has turned off notifications
            const senderId = 'alice'
            const db = mocks.firestoreMock
            // @ts-ignore because our mock is fine
            const res = await notifications.getTokensForChatNotification(userIds, senderId, db)
            assert.deepEqual(res, ['bob_t'])
        })
        it('Includes users who do not have a notification preference set', async () => {
            const userIds = ['alice', 'bob'] // Bob does not have a preference defined
            const senderId = 'alice'
            const db = mocks.firestoreMock
            // @ts-ignore because our mock is fine
            const res = await notifications.getTokensForChatNotification(userIds, senderId, db)
            assert.deepEqual(res, ['bob_t'])
        })
        it('Includes users who have agreed to activity detail notifications', async () => {
            const userIds = ['alice', 'guy2',] // Guy2 has allowed notifications
            const senderId = 'alice'
            const db = mocks.firestoreMock
            // @ts-ignore because our mock is fine
            const res = await notifications.getTokensForChatNotification(userIds, senderId, db)
            assert.deepEqual(res, ['guy_2'])
        })
    })
    
    describe('Chat notification factory', () => {
        it('Returns the correct shape of data', () => {
            const test_token = 'hello'
            const test_activity = 'id'
            const test_title = 'name'
            const test_message = 'How you doin'
            const res = notifications.createChatNotification(test_token, test_activity, test_title, test_message)
            assert.deepEqual(res, {
                token: test_token,
                notification: {
                    title: test_title,
                    body: test_message
                },
                data: {
                    activity_id: test_activity
                },
                apns: {
                    payload: {
                        aps: {
                            'thread-id': test_activity
                        }
                    }
                }
            })
        })
        it ('Uses the given token for messaging', () => {
            const test_token = 'abcde'
            const res = notifications.createChatNotification(test_token, '', '', '')
            // @ts-ignore because token DOES exist on the type
            assert.equal(res.token, test_token)
        })
    })

    describe('Activity users changed handler', () => {
        afterEach(() => {
            // @ts-ignore because it doesn't like the spy type:
            notifications.sendChatMessage.restore()
        })

        it('Does nothing if there are the same users', async () => {
            const msgSpy = sinon.spy(notifications, 'sendChatMessage')
            const change = {
                after: {
                    id: 'after',
                    data: () => ({
                        members: ['alice', 'bob']
                    })
                },
                before: {
                    id: 'before',
                    data: () => ({
                        members: ['alice', 'bob']
                    })
                }
            }
            // @ts-ignore
            const res = await notifications.onActivityUsersChanged(change, {})
            assert(msgSpy.notCalled)
        })
        it('Does nothing if there are no users', async () => {
            const msgSpy = sinon.spy(notifications, 'sendChatMessage')
            const change = {
                after: {
                    id: 'after',
                    data: () => null
                },
                before: {
                    id: 'before',
                    data: () => ({
                        members: []
                    })
                }
            }
            // @ts-ignore
            const res = await notifications.onActivityUsersChanged(change, {})
            assert(msgSpy.notCalled)
        })

        it('Does nothing if the joined user does not exist', async() => {
            const msgSpy = sinon.spy(notifications, 'sendChatMessage')
            const change = {
                after: {
                    id: 'after',
                    data: () => ({
                        members: ['xyz']
                    })
                },
                before: {
                    id: 'before',
                    data: () => null
                }
            }
            // @ts-ignore
            const res = notifications.onActivityUsersChanged(change, {})
            assert(msgSpy.notCalled)
        })

        it('Send a chat message about leaving if a user has left', async () => {
            const msgSpy = sinon.spy(notifications, 'sendChatMessage')
            const change = {
                after: {
                    id: 'after',
                    data: () => ({
                        members: ['1']
                    })
                },
                before: {
                    id: 'before',
                    data: () => ({
                        members: ['1', 'bob']
                    })
                }
            }
            // @ts-ignore
            const res = await notifications.onActivityUsersChanged(change, {})
            const message = msgSpy.args[0][1]
            const words = message.split(' ')
            assert(words.indexOf('left') !== -1)
        })
        it('Sends a chat message about joining if a user has joined', async () => {
            const msgSpy = sinon.spy(notifications, 'sendChatMessage')
            const change = {
                after: {
                    id: 'after',
                    data: () => ({ members: ['1', 'bob'] })
                },
                before: {
                    id: 'before',
                    data: () => ({
                        members: ['1']
                    })
                }
            }
            // @ts-ignore
            const res = await notifications.onActivityUsersChanged(change, {})
            const message = msgSpy.args[0][1]
            const words = message.split(' ')
            assert(words.indexOf('joined') !== -1)
        })
        it('References the user in the message if they join', async () => {
            const msgSpy = sinon.spy(notifications, 'sendChatMessage')
            const change = {
                after: {
                    id: 'after',
                    data: () => ({ members: ['1', 'bob'] })
                },
                before: {
                    id: 'before',
                    data: () => ({
                        members: ['1']
                    })
                }
            }
            // @ts-ignore
            const res = await notifications.onActivityUsersChanged(change, {})
            const message = msgSpy.args[0][1]
            const words = message.split(' ')

            assert(words.indexOf('BOB') !== -1)
        })
        it('Does not reference the user in the message if they leave', async () => {
            const msgSpy = sinon.spy(notifications, 'sendChatMessage')
            const change = {
                after: {
                    id: 'after',
                    data: () => ({ members: ['1'] })
                },
                before: {
                    id: 'before',
                    data: () => ({
                        members: ['1', 'bob']
                    })
                }
            }
            // @ts-ignore
            const res = await notifications.onActivityUsersChanged(change, {})
            const message = msgSpy.args[0][1]
            const words = message.split(' ')

            assert(words.indexOf('BOB') === -1)
        })
    })

    describe('Send Chat Message', () => {
        it('Adds the given data with the right shape to the chat ref', async () => {
            const activityId = 'chat_msg'
            const message = 'Howdy folks'
            const sender = 'Your Mom'
            const date = new Date()
            const res = await notifications.sendChatMessage(activityId, message, sender, date)
            assert.deepEqual(res, {
                message,
                sender,
                date_sent: date,
                type: 'user_join_or_leave'
            })
        })
    })

    describe('Get users from change', () => {
        it('Returns an empty array if the data is in the wrong format', () => {
            const doc = {data: () => ({ members: 'what' })}
            // @ts-ignore
            const res = notifications.getUsersFromChange(doc)
            assert.deepEqual(res, [])
        })
        it('Returns an empty array if there is no data', () => {
            const doc = {data: () => null}
            // @ts-ignore
            const res = notifications.getUsersFromChange(doc)
            assert.deepEqual(res, [])
        })
        it('Returns the array if it exists', () => {
            const doc = {data: () => ({ members: ['foo', 'bar'] })}
            // @ts-ignore
            const res = notifications.getUsersFromChange(doc)
            assert.deepEqual(res, ['foo', 'bar'])
        })
    })

    describe('Get users who joined or left an activity', () => {
        it('Returns a tuple of empty arrays', () => {
            const test1 = ['hi']
            const test2 = ['hi']
            assert.deepEqual(notifications.getUserDiff(test1, test2), [[],[]])
        })
        it('Returns the users who joined', () => {
            const before = ['hi', 'de', 'no']
            const after = ['hi', 'no']
            const res = notifications.getUserDiff(before, after)
            assert.deepEqual(res, [[], ['de']])
        })
        it('Returns the users who left', () => {
            const before = ['hi', 'de', 'no']
            const after = ['hi', 'de', 'ab', 'no']
            const res = notifications.getUserDiff(before, after)
            assert.deepEqual(res, [['ab'], []])
        })
        it('Returns both joined AND left users', () => {
            const before = ['hi', 'de', 'no', 'gah', 'axe body spray']
            const after = ['hi', 'de', 'ab', 'no']
            const res = notifications.getUserDiff(before, after)
            assert.deepEqual(res, [['ab'], ['gah', 'axe body spray']])

        })
        it('Works if one of the parameters is an empty array', () => {
            const before = ['hi', 'de', 'no']
            const after: string[] = []
            const res = notifications.getUserDiff(before, after)
            assert.deepEqual(res, [[], ['hi', 'de', 'no']])
        })
    })
})