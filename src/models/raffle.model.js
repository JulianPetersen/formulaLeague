import mongoose from 'mongoose';
import appConfig from '../config';

const raffleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  prizeName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  costPerTicket: {
    type: Number,
    required: true,
    min: 1
  },
  startsAt: { 
    type: Date,
    default: Date.now
  },
  endsAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'drawn', 'delivered', 'cancelled'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  ticketsSold: {
    type: Number,
    default: 0,
    min: 0
  }, 
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winningTicket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RaffleTicket'
  },
  claimStatus: {
    type: String,
    enum: ['unclaimed', 'claimed', 'delivered'],
    default: 'unclaimed'
  },
  claimedAt: Date,
  drawnAt: Date,
  deliveredAt: Date
}, { timestamps: true, versionKey: false });

raffleSchema.index({ status: 1, endsAt: 1 });
raffleSchema.index({ featured: 1, status: 1 });

raffleSchema.methods.setImgUrl = function setImgUrl(filename) {
  const { host } = appConfig;
  this.image = `${host}/public/${filename}`;
};

export default mongoose.model('Raffle', raffleSchema);
