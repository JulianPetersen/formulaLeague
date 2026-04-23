import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, unique:true },
  email: { type: String, required: true, unique: true },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  passwordHash: { type: String },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  points: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verifyToken: { type: String },
  verifyTokenExpires: { type: Date },
  aceptTerms:{type: Boolean, default:false},
  createdAt: { type: Date, default: Date.now },

  resetToken: String,
  resetTokenExpires: Date,
});

export default mongoose.model("User", userSchema);
