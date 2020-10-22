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

const { validSignUp, validLogin } = require('./validate');
const { validationResult } = require('express-validator');

// auth
const auth = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split('Bearer ')[1];
  } else {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      req.user = decodedToken;
      return db
        .collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.handle = data.docs[0].data().handle;
      console.log(data.docs[0].data());
      return next();
    })
    .catch((err) => {
      if (err.code === 'auth/argument-error') {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      if (err.code === 'auth/id-token-expired') {
        return res.status(401).json({ message: 'Token is expired' });
      }
      return res.status(401).json({ message: err.code });
    });
};

app.get('/screams', auth, async (req, res) => {
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
        handle: doc.data().handle,
        createdAt: doc.data().createdAt,
      })
    );
    return res.status(200).json(screams);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/screams', auth, async (req, res) => {
  try {
    const { body } = req.body;
    const newStream = {
      body,
      handle: req.user.handle,
      createdAt: new Date().toISOString(),
    };
    console.log('asdasdasd');
    await db.collection(screamsCollection).add(newStream);
    return res.json({ message: 'Add success!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

app.put('/screams/:id', async (req, res) => {
  try {
    const { body } = req.body;
    const newStream = {
      body,
    };
    await db.collection(screamsCollection).doc(req.params.id).update(newStream);
    return res.json({ message: 'Update success!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

app.delete('/screams/:id', async (req, res) => {
  try {
    await db.collection(screamsCollection).doc(req.params.id).delete();
    return res.json({ message: 'Delete success!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/signup', validSignUp, async (req, res) => {
  try {
    const { email, password, passwordConfirm, handle } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({ error: 'Password does not match!' });
    }
    const data = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);
    const token = await data.user.getIdToken();
    await db.collection('users').add({
      userId: data.user.uid,
      handle,
      email,
      password,
      createdAt: new Date().toISOString(),
    });
    return res.status(201).json({ token });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: err.message });
  }
});

app.post('/login', validLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const data = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const token = await data.user.getIdToken();
    return res.json({ token });
  } catch (err) {
    console.error(err.code);
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/wrong-password'
    ) {
      return res.status(403).json({ message: 'Invalid credentials!' });
    }
    return res.status(500).json({ message: err.code });
  }
});

exports.api = functions.https.onRequest(app);
