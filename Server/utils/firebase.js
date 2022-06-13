const admin = require("firebase-admin");
const serviceAccountKey = require("../trade-journal-a1d04-firebase-adminsdk-rnbcl-f83f7eb9ae.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccountKey) });
const db = admin.firestore();
