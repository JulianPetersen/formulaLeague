import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  count: { type: Number },
  page: {type: String}
},
  { timestamps: true, versionKey: false }
);

export default mongoose.model('visitsPage', schema);