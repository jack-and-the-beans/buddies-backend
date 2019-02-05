import * as assert from 'assert'
import * as mocks from './mocks'
import 'mocha'

import Refs from '../firestoreRefs'

describe('Firestore Refs', () => {
  it('Returns the Activities ref', async () => {
    // @ts-ignore
    const res = await Refs(mocks.firestoreMock).activities().doc('default').get()
    const data = res.data()
    assert(data.title === 'Security Meetup')
  })
  it('Returns the Users ref', async () => {
    // @ts-ignore
    const res = await Refs(mocks.firestoreMock).users().doc('bob').get()
    const data = res.data()
    assert(data.name === 'BOB THE BUILDER')
  })
})