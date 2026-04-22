import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  token: { type: String, unique: true }
});

export default mongoose.model('PushToken', schema);