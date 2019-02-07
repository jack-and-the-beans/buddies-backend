import * as assert from 'assert'
import * as sinon from 'sinon'
import * as mocks from './mocks'
import 'mocha'

import UserManagement from '../userManagement'
// @ts-ignore
const userManagement = new UserManagement(mocks.firestoreMock, mocks.storageBucketMock)

describe('User Management', () => {
  describe('On user delete', () => {
    it('Deletes the Firestore document for the user', async () => {
      const dbSpy = sinon.spy(mocks, 'spyOnMe1')
      const testUser = {
        uid: 'hello'
      }
      // @ts-ignore
      await userManagement.onUserDelete(testUser, {})
      assert(dbSpy.calledOnce)
      dbSpy.restore()
    })
    it('Deletes their profile picture if it exists', async () => {
      const fileSpy = sinon.spy(mocks, 'spyOnMe2')
      const testUser = {
        uid: 'bob_builder'
      }
      // @ts-ignore
      await userManagement.onUserDelete(testUser, {})
      assert(fileSpy.calledOnce)
      fileSpy.restore()
    })
    it('Does not try to delete their profile picture if it does not exist', async () => {
      const fileSpy = sinon.spy(mocks, 'spyOnMe2')
      const testUser = {
        uid: 'not_exists'
      }
      // @ts-ignore
      await userManagement.onUserDelete(testUser, {})
      assert(fileSpy.notCalled)
      fileSpy.restore()
    })
  })
})