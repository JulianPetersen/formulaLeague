import mongoose from 'mongoose';
import appConfig from '../config';


const pilotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: Number, required: true, unique: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  country: { type: String },
  img:{ type: String }
});


pilotSchema.methods.setImgUrl = function setImgUrl (filename){
    const {host, port} = appConfig
    this.img = `${host}/public/${filename}`
}


module.exports = mongoose.model('Pilot', pilotSchema);
  