import PushToken from '../models/pushToken.model.js';
  import admin from 'firebase-admin';

  export const saveToken = async (req, res) => {
    const { token } = req.body;

    await PushToken.findOneAndUpdate(
      { token },
      { token },
      { upsert: true }
    );

    await admin.messaging().subscribeToTopic([token], 'news');

    res.json({ ok: true });
  };

  export const deleteToken = async (req, res) => {
    const { token } = req.body;

    await PushToken.deleteOne({ token });

    res.json({ ok: true });
  };

  export const sendNotification = async (title, body, data = {}) => {
    await admin.messaging().send({
      notification: { title, body },
      data,
      topic: 'news'
    });
  };