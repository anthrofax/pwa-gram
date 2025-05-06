const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: "http://127.0.0.1:8080" });
const { initializeApp } = require("firebase-admin/app");
const webPush = require("web-push");
const {v4: uuid4 } = require("uuid");
const formidable = require("formidable");
const fs = require("fs");
const { Storage } = require('@google-cloud/storage');

var serviceAccount = require("./service-account.json");

const gcsConfig = {
  projectId: "pwa-learn-69738",
  keyFilename: "./service-account.json",
};


const gcs = new Storage(gcsConfig);

initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://pwa-learn-69738-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

function sendPushNotification(subscription) {
  const pushConfig = {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
    },
  };

  const payload = JSON.stringify({
    title: "New Post",
    content: "New post added!",
    openUrl: "/help",
  });

  webPush.sendNotification(pushConfig, payload).catch((error) => {
    console.error("Error sending push notification:", error);
  });
}

exports.storePostData = onRequest((request, response) => {
  cors(request, response, () => {
    const formData = new formidable.IncomingForm();

    formData.parse(request, (err, fields, files) => {
      fs.rename(files.file.path, `/tmp/${files.file.name}`);

      let bucket = gcs.bucket("pwa-learn-69738.firebasestorage.app");
      const uuid = uuid4();

      bucket.upload(
        `/tmp/${files.file.name}`,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: files.file.type,
              firebaseStorageDownloadTokens: uuid,
            },
          },
        },
        function (err, file) {
          if (!err) {
            admin
              .database()
              .ref("posts")
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                image: `https://firebasestorage.googleapis.com/v0/b/${
                  bucket.name
                }/o/${encodeURIComponent(file.name)}?alt=media&token${uuid}`,
              })
              .then(() => {
                console.log("Data stored", fields);

                const vapidPrivateKey =
                  "fB2C9OVY4u2dmzcScKX1ASVsmuyAM4q9zKEuBzrwX0E";
                const vapidPublicKey =
                  "BONa2hy8asjhYWVivsTTxNY5ZtGxN6VGfAlbvLi9iVDgoXnL5mquqBtoNsJK2jffOY4Idshju3D5AAbVcQwib9k";
                const vapidEmail = "hiprofax@gmail.com";

                webPush.setVapidDetails(
                  vapidEmail,
                  vapidPublicKey,
                  vapidPrivateKey
                );

                // Maksud dari once adalah untuk fetch sekali saja, tidak berkelanjutan (real time data)
                return admin.database().ref("subscriptions").once("value");
              })
              .then((subscriptions) => {
                // subscriptions sebenarnya dalam bentuk object, tapi
                subscriptions.forEach((childSnapshot) => {
                  const sub = childSnapshot.val();
                  sendPushNotification(sub);
                });
              })
              .catch(() => {
                return response.status(400).json({ error: "Error" });
              });
          } else {
            console.log(err);
          }
        }
      );
    });
  });
});
