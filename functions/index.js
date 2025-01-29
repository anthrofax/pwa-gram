const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { initializeApp } = require("firebase-admin/app");

var serviceAccount = require("./service-account.json");

initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://pwa-learn-69738-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

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
        return response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch(() => {
        return response.status(400).json({ error: "Error" });
      });
  });
});