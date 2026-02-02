import mongoose from 'mongoose';
import appConfig from '../config';


const teamsSchema = new mongoose.Schema({
  name: { type: String },
  img: { type: String },
},
{ timestamps: true, versionKey: false });


teamsSchema.methods.setImgUrl = function setImgUrl (filename){
    const {host, port} = appConfig
    this.img = `${host}/public/${filename}`
}


export default mongoose.model("Team", teamsSchema);
