import * as assert from 'assert'
// import * as admin from 'firebase-admin'
// import * as algoliasearch from 'algoliasearch'
import * as sinon from 'sinon'
import * as mocks from './mocks'
import 'mocha'

import * as notifications from '../notifications'

// NOTE: The `@ts-ignore` statements in this file are because much of the data
// does not fit the shape of the expected data. This is what we want, because
// we're trying to test the edge cases where the data doesn't fit what's expected.

describe('Activity creation handler', () => {
    it('Gets activity data based on the data changed', async () => {
        const dataSpy = sinon.spy(notifications, 'getActivityData')
        // @ts-ignore
        await notifications.activityCreationHandler(mocks.testActivitySnap, {})
        assert(dataSpy.calledOnce)
    })

    it('It returns early if there is no data', async () => {
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
