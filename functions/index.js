const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./admin.json')),
  databaseURL: 'https://fir-gallery-c070d.firebaseio.com',
});

const firebaseConfig = {
  apiKey: 'AIzaSyDDdkCElldoA4YptJ_0GVenK8ru3-n6m3U',
  authDomain: 'fir-gallery-c070d.firebaseapp.com',
  databaseURL: 'https://fir-gallery-c070d.firebaseio.com',
  projectId: 'fir-gallery-c070d',
  storageBucket: 'fir-gallery-c070d.appspot.com',
  messagingSenderId: '538177884017',
  appId: '1:538177884017:web:186cffb8cf82ea8369f0d0',
};

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();
const express = require('express');
const app = express();

// Collection
const screamsCollection = 'screams';

app.get('/screams', async (req, res) => {
  try {
    const data = await db
      .collection(screamsCollection)
      .orderBy('createdAt', 'desc')
      .get();
    let screams = [];
    data.forEach((doc) =>
      screams.push({
        screamId: doc.id,
        body: doc.data().body,
        userHandle: doc.data().userHandle,
        createdAt: doc.data().createdAt,
      })
    );
    return res.status(200).json(screams);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

app.post('/screams', async (req, res) => {
  try {
    const { body, userHandle } = req.body;
    const newStream = {
      body,
      userHandle,
      createdAt: new Date().toISOString(),
    };
    await db.collection(screamsCollection).add(newStream);
    return res.json({ message: 'Add success!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

app.put('/screams/:id', async (req, res) => {
  try {
    const { body, userHandle } = req.body;
    const newStream = {
      body,
      userHandle,
    };
    await db.collection(screamsCollection).doc(req.params.id).update(newStream);
    return res.json({ message: 'Update success!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

app.delete('/screams/:id', async (req, res) => {
  try {
    await db.collection(screamsCollection).doc(req.params.id).delete();
    return res.json({ message: 'Delete success!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

exports.api = functions.https.onRequest(app);
