import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  race: { type: mongoose.Schema.Types.ObjectId, ref: 'Race', required: true },
  // positions: [{ pilot: ObjectId, position: Number }]
  positions: [{
    pilot: { type: mongoose.Schema.Types.ObjectId, ref: 'Pilot', required: true },
    position: { type: Number, required: true, min: 1, max: 20 }
  }],
  points: {
    type: Number,
    default: 0
  },
  processed: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true, versionKey: false }
);
predictionSchema.index({ user: 1, race: 1 }, { unique: true }); // 1 pronóstico por usuario por carrera


module.exports = mongoose.model('Prediction', predictionSchema);