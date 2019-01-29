import * as firebase from 'firebase';

const validMimeTypes = [
    "image/png",
    "image/jpeg",
];

export function createTopic(topicToCreate: TopicToCreate) {
    // Dependencies
    var storage = firebase.storage();
    var db = firebase.firestore();

    // Valitade imageFile is selected
    if (!topicToCreate.imageFile)
        throw "No file selected";

    if (!topicToCreate.name || topicToCreate.name.length === 0) {
        throw "No topic name given"
    }

    if (validMimeTypes.indexOf(topicToCreate.imageFile.type) === -1)
        throw "Invalid file type, should be png of jpeg";

    // 1. Insert topic
    // 2. Upload file with the topic ID
    // 3. Update topic with downloadURL of file
    return db.collection('topics').add({
        name: topicToCreate.name,
        date_created: new Date()
    }).then(document => {
        const fileRef = storage.ref(`topic_pictures/${document.id}`);
        return fileRef.put(topicToCreate.imageFile)
            .then(task => fileRef.getDownloadURL())
            .then(image_url => document.update({ image_url }))
    })
}

export function deleteTopic(id: string) {
    if (!confirm('Are you sure you want to delete this topic?')) return
    const storage = firebase.storage();
    const db = firebase.firestore();
    const fileRef = storage.ref(`topic_pictures/${id}`)
    const topicRef = db.collection('topics').doc(id)
    return topicRef.delete().then(() => fileRef.delete())
}
