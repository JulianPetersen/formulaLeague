
    import mongoose from 'mongoose';

    const schema = new mongoose.Schema({
        type: { type: String },
        message: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        status: {
            type: String,
            enum: ['INFO', 'ERROR', 'WARNING'],
            default: 'INFO'
        }
    },
        { timestamps: true, versionKey: false }

    );

    export default mongoose.model('Logs', schema);