import mongoose from 'mongoose';

const raffleTicketSchema = new mongoose.Schema({
  raffle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Raffle',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketNumber: {
    type: Number,
    required: true,
    min: 1
  },
  cost: {
    type: Number,
    required: true,
    min: 1
  }
}, { timestamps: true, versionKey: false });

raffleTicketSchema.index({ raffle: 1, ticketNumber: 1 }, { unique: true });
raffleTicketSchema.index({ raffle: 1, user: 1 });
raffleTicketSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('RaffleTicket', raffleTicketSchema);
