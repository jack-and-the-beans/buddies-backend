import * as functions from 'firebase-functions'
import * as algoliasearch from 'algoliasearch'
import * as constants from './constants'

export default class AlgoliaSync {
  constructor(public client: algoliasearch.Client) { }

  activityDataHandler (change: functions.Change<FirebaseFirestore.DocumentSnapshot>, context: functions.EventContext) {
    return this.algoliaSync<AlgoliaActivity>(this.client.initIndex(constants.ACTIVITY_INDEX_NAME), change, this.getAlgoliaActivityData, this.hasActivityChanged)
  }
  
  // Triggered on create, update, and delete:
  userDataHandler (change: functions.Change<FirebaseFirestore.DocumentSnapshot>, context: functions.EventContext) {
    return this.algoliaSync<AlgoliaUser>(this.client.initIndex(constants.USER_INDEX_NAME), change, this.getAlgoliaUserData, this.hasUserChanged)
  }
  
  // Creates, updates, or deletes objects in the given Algolia index based on the
  // data from the document change. Utilizes dataFunc and compareFunc respectively
  // to get database data from change and to compare entries of type T.
  async algoliaSync<T extends AlgoliaBase>(algoliaIndex: algoliasearch.Index,
                                change: functions.Change<FirebaseFirestore.DocumentSnapshot>,
                                dataFunc: (doc: FirebaseFirestore.DocumentSnapshot) => T | null,
                                compareFunc: (a: T, b: T) => boolean): Promise<void> {
    const newData = dataFunc(change.after)
    const oldData = dataFunc(change.before);
    
    // Create object:
    if (!oldData && newData) {
      await algoliaIndex.addObject(newData)
    }
  
    // Delete object:
    if (!newData && oldData) {
      await algoliaIndex.deleteObject(oldData.objectID)
    }
  
    // Update object:
    if (newData && oldData && compareFunc(oldData, newData)) {
      await algoliaIndex.partialUpdateObject(newData)
    }
  }
  
  getAlgoliaUserData(doc: FirebaseFirestore.DocumentSnapshot): AlgoliaUser | null {
    const data = doc.data()
    if (!doc.exists || !data) {
      return null
    }
    if (!data.favorite_topics || !data.blocked_users || !data.blocked_by || !data.location) {
      return null
    }
    // Concatenates and removes duplicates:
    const block_filter: string[] = [...new Set([].concat(data.blocked_by, data.blocked_users))]
    return {
      block_filter,
      objectID: doc.id,
      favorite_topics: data.favorite_topics,
      should_send_activity_suggestion_notification: data.should_send_activity_suggestion_notification == null ? true : data.should_send_activity_suggestion_notification,
      _geoloc: this.locationConvert(data.location),
      notification_token: data.notification_token ? data.notification_token : ''
    }
  }
  
  hasUserChanged(a: AlgoliaUser, b: AlgoliaUser): boolean {
    if (a.should_send_activity_suggestion_notification !== b.should_send_activity_suggestion_notification ||
        a._geoloc.lng !== b._geoloc.lng ||
        a._geoloc.lat !== b._geoloc.lat ||
        this.areArrsDifferent(a.block_filter, b.block_filter) ||
        this.areArrsDifferent(a.favorite_topics, b.favorite_topics) ||
        a.notification_token !== b.notification_token
      ) {
      return true
    }
    return false
  }
  
  // Gets the data we need from the document:
  getAlgoliaActivityData(doc: FirebaseFirestore.DocumentSnapshot): AlgoliaActivity | null {
    const data = doc.data()
    if (!doc.exists || !data) {
      return null
    }
    if (!data.location || !data.title || !data.description || !data.start_time || !data.end_time || !data.topic_ids) {
      return null
    }
    return {
      objectID: doc.id,
      _geoloc: this.locationConvert(data.location),
      title: data.title,
      description: data.description,
      start_time: data.start_time.toDate(),
      end_time: data.end_time.toDate(),
      topic_ids: data.topic_ids,
    }
  }
  
  hasActivityChanged(a: AlgoliaActivity, b: AlgoliaActivity): boolean {
    if (a.title !== b.title ||
        a.description !== b.description ||
        a._geoloc.lat !== b._geoloc.lat ||
        a._geoloc.lng !== b._geoloc.lng ||
        a.start_time.getTime() !== b.start_time.getTime() ||
        a.end_time.getTime() !== b.end_time.getTime() ||
        this.areArrsDifferent(a.topic_ids, b.topic_ids)
      ) {
      return true
    }
    return false
  }
  
  locationConvert(loc: FirebaseFirestore.GeoPoint): AlgoliaGeoPoint {
    return {
      lat: loc.latitude,
      lng: loc.longitude,
    }
  }
  
  // Deep equal check an array of strings for equality:
  areArrsDifferent(a: string[], b: string[]): boolean {
    return a.sort().join(',') !== b.sort().join(',')
  }
}