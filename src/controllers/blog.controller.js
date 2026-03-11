import Blog from "../models/blog.model";
import appConfig from "../config";


const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
};

const generateUniqueSlug = async (title) => {

  const baseSlug = generateSlug(title);

  let slug = baseSlug;
  let counter = 1;

  while (await Blog.findOne({ slug })) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;

};


const extractFirstImage = (html) => {

  const regex = /<img[^>]+src="([^">]+)"/;

  const match = html.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  return null;

};

export const createNews = async (req, res) => {
  try {

    const { title, summary, content, published } = req.body;

    const slug = await generateUniqueSlug(title);

    const coverImage = extractFirstImage(content);

    const newBlog = new Blog({
      title,
      slug,
      summary,
      content,
      coverImage,
      published
    });

    const blogSaved = await newBlog.save();

    res.status(200).json(blogSaved);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllnews = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getnewsById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    res.status(200).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatenews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, content, published } = req.body;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Noticia no encontrada" });
    }

    if (title) blog.title = title;
    if (summary) blog.summary = summary;
    if (content) blog.content = content;
    if (published !== undefined) blog.published = published;

    const updatedBlog = await blog.save();

    res.status(200).json(updatedBlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteNews = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Noticia eliminada correctamente"
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const uploadNewsImage = async (req, res) => {
  try {

    const { filename } = req.file;
    const { host } = appConfig;

    const url = `${host}/public/${filename}`;

    res.status(200).json({
      url
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getBlogBySlug = async (req, res) => {
  try {

    const blog = await Blog.findOne({ slug: req.params.slug });

    res.status(200).json(blog);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};  