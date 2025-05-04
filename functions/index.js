const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: "true" });
const { initializeApp } = require("firebase-admin/app");
const webPush = require("web-push");

var serviceAccount = require("./service-account.json");

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
    title: 'New Post',
    content: 'New post added!',
  });

  webPush.sendNotification(pushConfig, payload)
    .catch(error => {
      console.error('Error sending push notification:', error);
    });
}

exports.storePostData = onRequest((request, response) => {
  cors(request, response, () => {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
      .then(() => {
        console.log("Data stored", request.body);

        const vapidPrivateKey = 'fB2C9OVY4u2dmzcScKX1ASVsmuyAM4q9zKEuBzrwX0E';
        const vapidPublicKey = 'BONa2hy8asjhYWVivsTTxNY5ZtGxN6VGfAlbvLi9iVDgoXnL5mquqBtoNsJK2jffOY4Idshju3D5AAbVcQwib9k';
        const vapidEmail = 'hiprofax@gmail.com';

        webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

        // Maksud dari once adalah untuk fetch sekali saja, tidak berkelanjutan (real time data)
        return admin.database().ref('subscriptions').once('value')
      }).then(subscriptions => {  // subscriptions sebenarnya dalam bentuk object, tapi 
        subscriptions.forEach(childSnapshot  => {
          const sub = childSnapshot.val();
          sendPushNotification(sub);
        });
      })
      .catch (() => {
      return response.status(400).json({ error: "Error" });
    });
});
});