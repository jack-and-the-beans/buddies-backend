import { storage, firestore } from './firebaseConfig'
import { reloadUsers, reloadActivities } from './index'

export function banUser(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return

    const ref = firestore().collection('accounts').doc(id)

    return ref.delete().then(reloadUsers)
}

export function banActivity(id: string) {
    if (!confirm('Are you sure you want to ban this activity?')) return

    const ref = firestore().collection('activities').doc(id)
    return ref.delete().then(reloadActivities)
}
