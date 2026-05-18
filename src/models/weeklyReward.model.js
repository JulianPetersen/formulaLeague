import mongoose from 'mongoose';


const weeklyRewardSchema = new mongoose.Schema({
  week: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WeeklyReward', weeklyRewardSchema);