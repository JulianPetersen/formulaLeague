import mongoose from 'mongoose';

const raceMindRushSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  distance: { type: Number, required: true },
  coinsCollected: { type: Number, required: true, default: 0 },
  durationMs: { type: Number, required: true },
  earnedRm: { type: Number, required: true, default: 0 },
  creditedRm: { type: Number, required: true, default: 0 },
  week: { type: String, required: true },
  startedAt: { type: Date },
  endedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

raceMindRushSchema.index({ week: 1, user: 1, score: -1 });
raceMindRushSchema.index({ user: 1, createdAt: 1 });

export default mongoose.model('RaceMindRush', raceMindRushSchema);
