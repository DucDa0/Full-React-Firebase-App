// validate
const { validationResult } = require('express-validator');

const { db } = require('../ultils/admin');

const firebaseConfig = require('../config/firebase');

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

exports.signup = async (req, res) => {
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
};

exports.signin = async (req, res) => {
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
};
