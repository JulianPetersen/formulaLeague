import mongoose from 'mongoose';

const walletClaimSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  prize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize'
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['bank_transfer', 'mercado_pago', 'paypal', 'other'],
    required: true
  },
  accountAlias: {
    type: String,
    required: true,
    trim: true
  },
  note: {
    type: String,
    trim: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  paidAt: Date,
  rejectedReason: String
}, { timestamps: true, versionKey: false });

walletClaimSchema.index({ user: 1, status: 1 });

export default mongoose.model('WalletClaim', walletClaimSchema);
