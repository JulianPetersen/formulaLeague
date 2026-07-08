import mongoose from 'mongoose';

const rankingSnapshotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: String,
  email: String,
  points: {
    type: Number,
    default: 0
  },
  position: {
    type: Number,
    required: true
  }
}, { _id: false });

const seasonResultSchema = new mongoose.Schema({
  prize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize',
    required: true,
    unique: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  winnerPoints: {
    type: Number,
    default: 0
  },
  rankingSnapshot: [rankingSnapshotSchema],
  closedAt: {
    type: Date,
    default: Date.now
  },
  pointsResetAt: Date
}, { timestamps: true, versionKey: false });

export default mongoose.model('SeasonResult', seasonResultSchema);
