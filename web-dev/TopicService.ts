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

    // Figure out what to save the image as
    var filename = topicToCreate.name.replace(/[^a-z0-9]/gi, '_').substring(0, 100);

    if (validMimeTypes.indexOf(topicToCreate.imageFile.type) === -1)
        throw "Invalid file type, should be png of jpeg";

    // Upload the image
    var fileRef = storage.ref("topic_pictures/" + filename);
    return fileRef.put(topicToCreate.imageFile).then(() => {
        // Grab a download url for the image
        return fileRef.getDownloadURL().then(image_url => {
            // Push this topic to the database!
            var translatedTopic: Topic = {
                name: topicToCreate.name,
                image_url,
            };

            return db.collection("topics").add(translatedTopic);
        });
    });
}