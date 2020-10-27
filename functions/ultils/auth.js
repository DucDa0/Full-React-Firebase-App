const { db, admin } = require('./admin');

module.exports = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split('Bearer ')[1];
  } else {
    return res.status(401).json({ error: 'No token, authorization denied' });
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
      req.user.doc_id = data.docs[0].id;
      return next();
    })
    .catch((err) => {
      if (err.code === 'auth/argument-error') {
        return res.status(401).json({ error: 'Token is not valid' });
      }
      if (err.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Token is expired' });
      }
      return res.status(401).json({ error: err.code });
    });
};
