import mongoose from 'mongoose';


const weeklyRewardSchema = new mongoose.Schema({
  week: { type: String, unique: true },
  games: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WeeklyReward', weeklyRewardSchema);
