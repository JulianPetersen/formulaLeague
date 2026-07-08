import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize'
  },
  claim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletClaim'
  },
  type: {
    type: String,
    enum: ['prize_credit', 'claim_hold', 'claim_release', 'claim_paid', 'adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled'],
    default: 'completed'
  },
  description: String,
  balanceAfter: {
    type: Number,
    required: true
  }
}, { timestamps: true, versionKey: false });

walletTransactionSchema.index(
  { type: 1, prize: 1 },
  {
    unique: true,
    partialFilterExpression: { type: 'prize_credit' }
  }
);

export default mongoose.model('WalletTransaction', walletTransactionSchema);
