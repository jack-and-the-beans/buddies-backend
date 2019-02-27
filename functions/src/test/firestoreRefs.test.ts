import * as assert from 'assert'
import * as mocks from './mocks'
import 'mocha'

import Refs from '../firestoreRefs'

describe('Firestore Refs', () => {
  it('Returns the Activities ref', async () => {
    const res = await Refs(mocks.firestoreMock).activities().doc('default').get()
    const data = res.data()!
    assert(data.title === 'Security Meetup')
  })
  it('Returns a user ref', async () => {
    const res = await Refs(mocks.firestoreMock).public_user('bob').get()
    const data = res.data()!
    assert(data.name === 'BOB THE BUILDER')
  })
  it('Returns the account ref', async () => {
    const res = await Refs(mocks.firestoreMock).account('bob').get()
    const data = res.data()!
    assert(data.notification_token === 'bob_t')
  })
})