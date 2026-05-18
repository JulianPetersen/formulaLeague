import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  latestVersion: { type: String, unique: true },
  foce:{ type: Boolean,},
  message:{ type: String},
});

export default mongoose.model('VersionApp', schema);