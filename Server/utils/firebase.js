const admin = require("firebase-admin");
const firebase = require("firebase");
const serviceAccount = require("../trade-journal-ad965-firebase-adminsdk-zuvs4-2bfdb33915.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://trade-journal-ad965.appspot.com",
});
const bucket = admin.storage().bucket();
const uploadPic = (picName, Picture) => {
  db.bucket.upload(
    Picture.path,
    {
      destination: "pic/" + picName,
      metadata: {
        contentType: Picture.mimetype,
        cacheControl: "public, max-age=31536000",
      },
    },
    (err, file) => {
      if (err) {
        console.log(err);
      } else {
        console.log("done");
      }
      return;
    }
  );
};
