import mongoose from "mongoose";
import appConfig from "../config";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    summary: { type: String },
    content: { type: String },
    published: { type: Boolean, default: false },
    coverImage: {
      type: String
    }
  },
  { timestamps: true, versionKey: false }
);

blogSchema.methods.setImgUrl = function setImgUrl(filename) {
  const { host } = appConfig;
  this.image = `${host}/public/${filename}`;
};

export default mongoose.model("Blog", blogSchema);