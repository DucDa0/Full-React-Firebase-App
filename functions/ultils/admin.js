const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('../admin.json')),
  databaseURL: 'https://fir-gallery-c070d.firebaseio.com',
});
const db = admin.firestore();
module.exports = { admin, db };
