import { Timestamp } from 'firebase-admin/firestore';
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    type: { type: String },
    messagge: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['INFO', 'ERROR', 'WARNING'],
        default: 'INFO'
    }
},
    { timestamps: true, versionKey: false }

);

export default mongoose.model('Logs', schema);