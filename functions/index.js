const functions = require('firebase-functions');
const express = require('express');
const app = express();

const {
  getAllScreams,
  createScream,
  editScream,
  deleteScream,
} = require('./handlers/screams');

const { signup, signin } = require('./handlers/users');

const { validSignUp, validLogin } = require('./ultils/validate');

const auth = require('./ultils/auth');

// user route
app.post('/signup', validSignUp, signup);
app.post('/signin', validLogin, signin);

// scream route
app.get('/screams', getAllScreams);
app.post('/screams', auth, createScream);
app.put('/screams/:id', auth, editScream);
app.delete('/screams/:id', auth, deleteScream);

exports.api = functions.https.onRequest(app);
