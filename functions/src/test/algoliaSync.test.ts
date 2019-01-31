import * as assert from 'assert'
import * as sinon from 'sinon'
import * as mocks from './mocks'
import 'mocha'

import * as algolia from '../algoliaSync'

describe('Function Handlers', () => {
  afterEach(() => {
    // @ts-ignore
    algolia.algoliaSync.restore()
  })

  it('Calls algolia sync on changes to activity data', async () => {
    const spy = sinon.spy(algolia, 'algoliaSync')
    // @ts-ignore
    algolia.activityDataHandler(mocks.syncTest.equalChange, {})
    assert(spy.calledOnce)
  })
  it('Calls algolia sync on changes to user data', async () => {
    const spy = sinon.spy(algolia, 'algoliaSync')
    // @ts-ignore
    algolia.userDataHandler(mocks.syncTest.equalChange, {})
    assert(spy.calledOnce)
  })
})

describe('Algolia Sync', () => {
  afterEach(() => {
    // @ts-ignore
    mocks.algoliaIndexMock.addObject.restore()
    // @ts-ignore
    mocks.algoliaIndexMock.deleteObject.restore()
    // @ts-ignore
    mocks.algoliaIndexMock.partialUpdateObject.restore()
  })
  it('Deletes the object from algolia if there is no new data', async () => {
    const index = mocks.algoliaIndexMock
    const deleteSpy = sinon.spy(index, 'deleteObject')
    const createSpy = sinon.spy(index, 'addObject')
    const updateSpy = sinon.spy(index, 'partialUpdateObject')

    // @ts-ignore
    await algolia.algoliaSync(index, 
      mocks.syncTest.deleteChange,
      mocks.syncTest.dataFunc,
      mocks.syncTest.compareFunc
    )
    assert(deleteSpy.calledOnceWith(mocks.syncTest.deleteArg))
    assert(createSpy.notCalled)
    assert(updateSpy.notCalled)
  })

  it('Adds the data to algolia if there is no old data', async () => {
    const index = mocks.algoliaIndexMock
    const deleteSpy = sinon.spy(index, 'deleteObject')
    const createSpy = sinon.spy(index, 'addObject')
    const updateSpy = sinon.spy(index, 'partialUpdateObject')

    // @ts-ignore
    await algolia.algoliaSync(index, 
      mocks.syncTest.newObject,
      mocks.syncTest.dataFunc,
      mocks.syncTest.compareFunc
    )
    assert(createSpy.calledOnceWith(mocks.syncTest.newArg))
    assert(deleteSpy.notCalled)
    assert(updateSpy.notCalled)
  })
  it('Updates the data in algolia if the data has changed', async () => {
    const index = mocks.algoliaIndexMock
    const deleteSpy = sinon.spy(index, 'deleteObject')
    const createSpy = sinon.spy(index, 'addObject')
    const updateSpy = sinon.spy(index, 'partialUpdateObject')

    // @ts-ignore
    await algolia.algoliaSync(index, 
      mocks.syncTest.diffChange,
      mocks.syncTest.dataFunc,
      mocks.syncTest.compareFunc
    )
    assert(updateSpy.calledOnceWith(mocks.syncTest.diffArg))
    assert(deleteSpy.notCalled)
    assert(createSpy.notCalled)
  })
  it('Does nothing if the data has not changed.', async () => {
    const index = mocks.algoliaIndexMock
    const deleteSpy = sinon.spy(index, 'deleteObject')
    const createSpy = sinon.spy(index, 'addObject')
    const updateSpy = sinon.spy(index, 'partialUpdateObject')

    // @ts-ignore
    await algolia.algoliaSync(index, 
      mocks.syncTest.equalChange,
      mocks.syncTest.dataFunc,
      mocks.syncTest.compareFunc
    )
    assert(updateSpy.notCalled)
    assert(deleteSpy.notCalled)
    assert(createSpy.notCalled)
  })
})

describe('Get user data function', () => {
  it('Returns null if the doc doesn\'t exist', () => {
    const doc = {
      exists: false,
      data: () => null
    }
    // @ts-ignore
    assert(algolia.getAlgoliaUserData(doc) === null)
  })
  it('Returns null if properties are missing', () => {
    const doc = {
      exists: true,
      id: 'abc',
      data: () => ({
        blocked_users: [],
      })
    }
    // @ts-ignore
    assert(algolia.getAlgoliaUserData(doc) === null)
  })
  it('Returns the correct shape if the data exists', () => {
    const doc = {
      exists: true,
      id: 'abc',
      data: () => ({
        blocked_users: ['a'],
        blocked_by: [],
        favorite_topics: ['x'],
        location: {
          latitude: 5,
          longitude: 10,
        },
        should_send_activity_suggestion_notification: true,
        notification_token: 'xyz'
      })
    }
    // @ts-ignore
    assert.deepEqual(algolia.getAlgoliaUserData(doc), {
      block_filter: ['a'],
      objectID: 'abc',
      favorite_topics: ['x'],
      _geoloc: {
        lat: 5,
        lng: 10,
      },
      should_send_activity_suggestion_notification: true,
      notification_token: 'xyz'
    })
  })
  it('Sets notification token to an empty string if it doesn\'t exist', () => {
    const doc = {
      exists: true,
      id: 'abc',
      data: () => ({
        blocked_users: ['a'],
        blocked_by: [],
        favorite_topics: ['x'],
        location: {
          latitude: 5,
          longitude: 10,
        },
        should_send_activity_suggestion_notification: true,
      })
    }
    // @ts-ignore
    assert.deepEqual(algolia.getAlgoliaUserData(doc), {
      block_filter: ['a'],
      objectID: 'abc',
      favorite_topics: ['x'],
      _geoloc: {
        lat: 5,
        lng: 10,
      },
      should_send_activity_suggestion_notification: true,
      notification_token: ''
    })
  })
  it('Removes duplicates from the block filter', () => {
    const doc = {
      exists: true,
      id: 'abc',
      data: () => ({
        blocked_users: ['a'],
        blocked_by: ['a', 'a'],
        favorite_topics: ['x'],
        location: {
          latitude: 5,
          longitude: 10,
        },
        should_send_activity_suggestion_notification: true,
        notification_token: 'xyz'
      })
    }
    // @ts-ignore
    assert.deepEqual(algolia.getAlgoliaUserData(doc), {
      block_filter: ['a'],
      objectID: 'abc',
      favorite_topics: ['x'],
      _geoloc: {
        lat: 5,
        lng: 10,
      },
      should_send_activity_suggestion_notification: true,
      notification_token: 'xyz'
    })
  })
  it('Sets notification preference to true if it has not been set', () => {
    const doc = {
      exists: true,
      id: 'abc',
      data: () => ({
        blocked_users: ['a'],
        blocked_by: ['a', 'a'],
        favorite_topics: ['x'],
        location: {
          latitude: 5,
          longitude: 10,
        },
        notification_token: 'xyz'
      })
    }
    // @ts-ignore
    assert.deepEqual(algolia.getAlgoliaUserData(doc), {
      block_filter: ['a'],
      objectID: 'abc',
      favorite_topics: ['x'],
      _geoloc: {
        lat: 5,
        lng: 10,
      },
      should_send_activity_suggestion_notification: true,
      notification_token: 'xyz'
    })
  })
  it('Respects the notification preference if it exists', () => {
    const doc = {
      exists: true,
      id: 'abc',
      data: () => ({
        blocked_users: ['a'],
        blocked_by: ['a', 'a'],
        favorite_topics: ['x'],
        location: {
          latitude: 5,
          longitude: 10,
        },
        should_send_activity_suggestion_notification: false,
        notification_token: 'xyz'
      })
    }
    // @ts-ignore
    assert.deepEqual(algolia.getAlgoliaUserData(doc), {
      block_filter: ['a'],
      objectID: 'abc',
      favorite_topics: ['x'],
      _geoloc: {
        lat: 5,
        lng: 10,
      },
      should_send_activity_suggestion_notification: false,
      notification_token: 'xyz'
    })
  })
})

describe('Has User Changed checker', () => {
  it('Returns true if notification prefs are different', () => {
    const data = {
      should_send_activity_suggestion_notification: true,
    }
    const data2 = {
      should_send_activity_suggestion_notification: false,
    }
    // @ts-ignore
    assert(algolia.hasUserChanged(data, data2) === true)
  })
  it('Returns true if longitude is different', () => {
    const data = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
      }
    }
    const data2 = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 200,
      }
    }
    // @ts-ignore
    assert(algolia.hasUserChanged(data, data2) === true)
  })
  it('Returns true if latitude is different', () => {
    const data = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 200
      }
    }
    const data2 = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 150
      }
    }
    // @ts-ignore
    assert(algolia.hasUserChanged(data, data2) === true)
  })
  it('Returns true if block filter is different', () => {
    const data = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 200
      },
      block_filter: ['a', 'b']
    }
    const data2 = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 200
      },
      block_filter: ['a', 'c']
    }
    // @ts-ignore
    assert(algolia.hasUserChanged(data, data2) === true)
  })
  it('Returns true if favorite topics are different', () => {
    const data = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 200
      },
      block_filter: ['a', 'b'],
      favorite_topics: ['x', 'y', 'z']
    }
    const data2 = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 200
      },
      block_filter: ['b', 'a'],
      favorite_topics: ['x', 'y']
    }
    // @ts-ignore
    assert(algolia.hasUserChanged(data, data2) === true)
  })
  it('Returns true if notification token is different', () => {
    const data = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 200
      },
      block_filter: ['a', 'b'],
      favorite_topics: ['x', 'y', 'z'],
      notification_token: 'abc',
    }
    const data2 = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 200
      },
      block_filter: ['b', 'a'],
      favorite_topics: ['z', 'x', 'y'],
      notification_token: 'xyz',
    }
    // @ts-ignore
    assert(algolia.hasUserChanged(data, data2) === true)
  })
  it('returns false if all the data is the same', () => {
    const data = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 200
      },
      block_filter: ['a', 'b'],
      favorite_topics: ['x', 'y', 'z'],
      notification_token: 'abc',
    }
    const data2 = {
      should_send_activity_suggestion_notification: true,
      _geoloc: {
        lng: 100,
        lat: 200
      },
      block_filter: ['b', 'a'],
      favorite_topics: ['z', 'x', 'y'],
      notification_token: 'abc',
    }
    // @ts-ignore
    assert(algolia.hasUserChanged(data, data2) === false)
  })
})

describe('Get Algolia Activity Data', () => {
  it('Returns null if there is no data', () => {
    const doc = {
      exists: false,
      data: () => null
    }
    // @ts-ignore
    assert(algolia.getAlgoliaActivityData(doc) === null)
  })
  it('Returns null if there is a property missing', () => {
    const doc = {
      exists: true,
      data: () => ({
        title: 'x',
        description: 'x',
      })
    }
    // @ts-ignore
    assert(algolia.getAlgoliaActivityData(doc) === null)
  })
  it('Returns the correct shape if the data exists', () => {
    const startTime = new Date(100)
    const endTime = new Date(500)
    const doc = {
      exists: true,
      id: 'a',
      data: () => ({
        title: 'b',
        description: 'c',
        location: {
          latitude: 100,
          longitude: 200,
        },
        start_time: { toDate: () => startTime },
        end_time: { toDate: () => endTime },
        topic_ids: [
          'x',
          'y'
        ]
      })
    }
    // @ts-ignore
    const res = algolia.getAlgoliaActivityData(doc)
    assert.deepEqual(res, {
      objectID: 'a',
      _geoloc: {
        lat: 100,
        lng: 200,
      },
      title: 'b',
      description: 'c',
      start_time: startTime,
      end_time: endTime,
      topic_ids: [
        'x',
        'y'
      ]
    })

  })
})

describe('Has Activity Changed checker', () => {
  it('Returns true if titles are different', () => {
    const data = {
      title: 'a'
    }
    const data2 = {
      title: 'b'
    }
    // @ts-ignore
    assert(algolia.hasActivityChanged(data, data2))
  })
  it('Returns true if descriptions are different', () => {
    const data = {
      title: 'a',
      description: 'a'
    }
    const data2 = {
      title: 'a',
      description: 'b'
    }
    // @ts-ignore
    assert(algolia.hasActivityChanged(data, data2))
  })
  it('Returns true if latitudes are different', () => {
    const data = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1
      }
    }
    const data2 = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 2
      }
    }
    // @ts-ignore
    assert(algolia.hasActivityChanged(data, data2))
  })
  it('Returns true if longitudes are different', () => {
    const data = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 3,
      }
    }
    const data2 = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 5,
      }
    }
    // @ts-ignore
    assert(algolia.hasActivityChanged(data, data2))

  })
  it('Returns true if start times are different', () => {
    const data = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 3,
      },
      start_time: {
        getTime: () => new Date(100)
      }
    }
    const data2 = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 3,
      },
      start_time: {
        getTime: () => new Date(1000)
      }
    }
    // @ts-ignore
    assert(algolia.hasActivityChanged(data, data2))
  })
  it('Returns true if end times are different', () => {
    const startTime = new Date()
    const data = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 3,
      },
      start_time: {
        getTime: () => startTime
      },
      end_time: {
        getTime: () => new Date(100)
      }
    }
    const data2 = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 3,
      },
      start_time: {
        getTime: () => startTime
      },
      end_time: {
        getTime: () => new Date(1000)
      }
    }
    // @ts-ignore
    assert(algolia.hasActivityChanged(data, data2))
  })
  it('Returns true if topic Ids are different', () => {
    const startTime = new Date()
    const endTime = new Date()
    const data = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 3,
      },
      start_time: {
        getTime: () => startTime
      },
      end_time: {
        getTime: () => endTime
      },
      topic_ids: ['a', 'b', 'c']
    }
    const data2 = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 3,
      },
      start_time: {
        getTime: () => startTime
      },
      end_time: {
        getTime: () => endTime
      },
      topic_ids: ['a', 'b', 'd']
    }
    // @ts-ignore
    assert(algolia.hasActivityChanged(data, data2))
  })
  it('Returns false if everything is the same', () => {
    const startTime = new Date()
    const endTime = new Date()
    const data = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 3,
      },
      start_time: {
        getTime: () => startTime
      },
      end_time: {
        getTime: () => endTime
      },
      topic_ids: ['a', 'b', 'c']
    }
    const data2 = {
      title: 'a',
      description: 'a',
      _geoloc: {
        lat: 1,
        lng: 3,
      },
      start_time: {
        getTime: () => startTime
      },
      end_time: {
        getTime: () => endTime
      },
      topic_ids: ['c', 'b', 'a']
    }
    // @ts-ignore
    assert(!algolia.hasActivityChanged(data, data2))
  })
})

describe('Location Converter', () => {
  it('Returns lat/lng format of location', () => {
    // @ts-ignore
    const res = algolia.locationConvert({
      latitude: 1.0,
      longitude: 2.0,
    })
    assert.deepEqual(res, {
      lat: 1.0,
      lng: 2.0
    })
  })
})

describe('Array of strings checker', () => {
  it('Returns false for empty arrays', () => {
    const res = algolia.areArrsDifferent([], [])
    assert(res === false)
  })

  it('Returns false for arrays in different order with same elements', () => {
    const res = algolia.areArrsDifferent(mocks.testStringArr1, mocks.testStringArr2)
    assert(res === false)
  })

  it('Returns false for arrays in the same order with same elements', () => {
    const res = algolia.areArrsDifferent(mocks.testStringArr1, mocks.testStringArr3)
    assert(res === false)
  })
  it('Returns true for different arrays', () => {
    const res = algolia.areArrsDifferent(mocks.testStringArr1, mocks.testStringArr4)
    assert(res === true)
  })
})