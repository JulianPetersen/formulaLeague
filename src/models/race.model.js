import mongoose from "mongoose";


const raceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  circuit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Track",
    required: true
  },
  date: { type: Date, required: true },
  pilots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pilot' }], // orden no implica resultado
  cutoff: { type: Date }, // hasta cuándo se puede pronosticar
  result: [
    {
      pilot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pilot",
        required: true
      },
      position: {
        type: Number,
        required: true
      }
    }
  ],
  status: {
    type: String,
    enum: ["lista","proximamente", "cerrada", "procesada"],
    default: "proximamente"
  }


},
  { timestamps: true, versionKey: false });


module.exports = mongoose.model('Race', raceSchema); 