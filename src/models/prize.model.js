import mongoose from 'mongoose';


const PrizeSchema = new mongoose.Schema({
    amount:{type:String, requiered:true},
    winner:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    endDate:{type:Date, requiered:true},
    participants:[{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        cantPoints: { type: Number, required: true, min: 1 }
      }],
      status: {
    type: String,
    enum: ["activo", "cerrado", "proximamente"],
    default: "proximamente"
  }
},{ timestamps: true, versionKey: false });

export default mongoose.model("Prize", PrizeSchema);
