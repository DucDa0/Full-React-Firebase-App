// validate
const { validationResult } = require('express-validator');

const { db, admin } = require('../ultils/admin');

const { v4: uuidv4 } = require('uuid');

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
    const noImg = 'cEYxCxV9rhelloworld.png';
    const data = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);
    const token = await data.user.getIdToken();
    await db.collection('users').add({
      userId: data.user.uid,
      handle,
      email,
      password,
      imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImg}?alt=media`,
      createdAt: new Date().toISOString(),
    });
    return res.status(201).json({ token });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
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
      return res.status(403).json({ error: 'Invalid credentials!' });
    }
    return res.status(500).json({ error: err.code });
  }
};

exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  let generatedToken = uuidv4();

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file extension' });
    }
    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    imageFileName = `${Math.round(
      Math.random() * 10000000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
    admin
      .storage()
      .bucket(firebaseConfig.storageBucket)
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            firebaseStorageDownloadTokens: generatedToken,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
        return db.doc(`/users/${req.user.doc_id}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: 'Image uploaded successfully!' });
      })
      .catch((err) => {
        return res.status(500).json({ error: err.message });
      });
  });
  busboy.end(req.rawBody);
};

exports.getAuthenticatedUser = async (req, res) => {
  let userData = {};
  try {
    const user = await db.doc(`/users/${req.user.doc_id}`).get();
    if (user.exists) {
      userData.credentials = user.data();
    }
    const data = await db.doc(`/likes/${req.user.doc_id}`).get();
    userData.likes = [];
    data.forEach((doc) => {
      userData.likes.push(doc.data());
    });

    return res.json(userData);
  } catch (err) {
    return res.status(500).json({ error: err.code });
  }
};

exports.addUserDetails = async (req, res) => {
  const { bio, website, location } = req.body.data;
  let userDetails = {};
  if (bio) {
    userDetails.bio = bio.trim();
  }
  if (website) {
    if (website.trim().substring(0, 4) !== 'http') {
      userDetails.website = `http://${website.trim()}`;
    } else {
      userDetails.website = website;
    }
  }
  if (location) {
    userDetails.location = location;
  }
  try {
    await db.doc(`/users/${req.user.doc_id}`).update(userDetails);
    return res.json({ message: 'Details added ok!' });
  } catch (err) {
    return res.status(500).json({ error: err.code });
  }
};
