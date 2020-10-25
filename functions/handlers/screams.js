const { db } = require('../ultils/admin');

exports.getAllScreams = async (req, res) => {
  try {
    const data = await db
      .collection('screams')
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
};

exports.createScream = async (req, res) => {
  try {
    const { body } = req.body;
    const newStream = {
      body,
      handle: req.user.handle,
      createdAt: new Date().toISOString(),
    };
    await db.collection('screams').add(newStream);
    return res.json({ message: 'Add success!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server Error' });
  }
};

exports.editScream = async (req, res) => {
  try {
    const { body } = req.body;
    const newStream = {
      body,
    };
    await db.collection('screams').doc(req.params.id).update(newStream);
    return res.json({ message: 'Update success!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server Error' });
  }
};

exports.deleteScream = async (req, res) => {
  try {
    await db.collection('screams').doc(req.params.id).delete();
    return res.json({ message: 'Delete success!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Server Error' });
  }
};
