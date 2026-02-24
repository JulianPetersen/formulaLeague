import mongoose from 'mongoose';
import appConfig from '../config';


const trackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String },
  img:{ type: String }
});


trackSchema.methods.setImgUrl = function setImgUrl (filename){
    const {host, port} = appConfig
    this.img = `${host}/public/${filename}`
}


module.exports = mongoose.model('Track', trackSchema); 