const { db, admin } = require('./admin');

module.exports = (req, res, next) => {
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
