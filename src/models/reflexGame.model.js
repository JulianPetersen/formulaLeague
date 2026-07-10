import mongoose from 'mongoose';

const reflexGameSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bestResult: { type: Number, required: true },
  averageResult: { type: Number, required: true },
  attempts: { type: Number, required: true, default: 5 },
  misses: { type: Number, required: true, default: 0 },
  week: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ReflexGame', reflexGameSchema);
