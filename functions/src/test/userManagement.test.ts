import * as assert from 'assert'
import * as sinon from 'sinon'
import * as mocks from './mocks'
import 'mocha'

import UserManagement from '../userManagement'
// @ts-ignore
const userManagement = new UserManagement(mocks.firestoreMock, mocks.storageBucketMock, mocks.authMock)

describe('User Management', () => {
  describe('On user delete', () => {
    it('Deletes their private doc', async () => {
      const dbSpy = sinon.spy(mocks, 'spyOnMe1')
      const testUser = {
        uid: 'hello'
      }
      await userManagement.onUserDelete(testUser, {})
      assert(dbSpy.calledOnce)
      dbSpy.restore()
    })
  })
  describe('On user private doc delete', () => {
    it('Deletes the public document for the user', async () => {
      const dbSpy = sinon.spy(userManagement, 'deletePublicAccount')
      const testUser = { id: 'hello' }
      await userManagement.onUserDocDelete(testUser, {})
      assert(dbSpy.calledOnce)
      dbSpy.restore()
    })
    it('Deletes their profile picture', async () => {
      const fileSpy = sinon.spy(userManagement, 'deleteUserPicture')
      const testUser = { id: 'hello' }
      await userManagement.onUserDocDelete(testUser, {})
      assert(fileSpy.calledOnce)
      fileSpy.restore()
    })
  })
  describe('Delete public account', () => {
    it('Deletes the public record for the given UID', () => {
      it('Deletes their public doc', async () => {
        const dbSpy = sinon.spy(mocks, 'spyOnMe1')
        await userManagement.deletePublicAccount('hello')
        assert(dbSpy.calledOnce)
        dbSpy.restore()
      })
    })
  })
  describe('Delete user picture', () => {
    it('Deletes their profile picture if it exists', async () => {
      const fileSpy = sinon.spy(mocks, 'spyOnMe2')
      const testUser = { id: 'hello' }
      await userManagement.onUserDocDelete(testUser, {})
      assert(fileSpy.calledOnce)
      fileSpy.restore()
    })
    it('Does not try to delete their profile picture if it does not exist', async () => {
      const fileSpy = sinon.spy(mocks, 'spyOnMe2')
      const testUser = { id: 'not_exists' }
      await userManagement.onUserDocDelete(testUser, {})
      assert(fileSpy.notCalled)
      fileSpy.restore()
    })
  })
})