import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bestResult: { type: Number }
});

export default mongoose.model('TrafiLigthGame', schema);