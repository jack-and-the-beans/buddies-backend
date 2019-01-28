import * as firebase from 'firebase';
import {Promise} from 'es6-promise'

const validMimeTypes = [
    "image/png",
    "image/jpeg",
];

export function createTopic(topicToCreate: TopicToCreate): Promise<any> {
    // Dependencies
    var storage = firebase.storage();
    var db = firebase.firestore();

    // Valitade imageFile is selected
    if (!topicToCreate.imageFile)
        return Promise.reject("No file selected");

    // Figure out what to save the image as
    var filename = topicToCreate.name.replace(/[^a-z0-9]/gi, '_').substring(0, 100);

    if (validMimeTypes.indexOf(topicToCreate.imageFile.type) === -1)
        return Promise.reject("Invalid file type, should be png of jpeg");

    // Upload the image
    var fileRef = storage.ref("topic_pictures/" + filename);
    var filePromise = fileRef.put(topicToCreate.imageFile);

    // Grab a download url for the image
    var dbPromise = fileRef.getDownloadURL()
        .then(image_url => {
            // Push this topic to the database!
            var translatedTopic: Topic = {
                name: topicToCreate.name,
                image_url,
            };

            return db.collection("topics").add(translatedTopic);
        });

    return Promise.all([filePromise, dbPromise]);
}