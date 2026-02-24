import Track from "../models/track.model";


export const crateTrack = async (req, res) => {
    try {
        console.log(req.body)
        const { name,country,img } = req.body
        const newTrack = new Track({ name,country,img })
        if (req.file) {
            const { filename } = req.file;
            newTrack.setImgUrl(filename)
        }
        const newTrackSaved = await newTrack.save();
        res.status(200).json(newTrackSaved)
    } catch (error) {
        res.status(400).json({messagge:error})
    }
}


export const getAllTracks = async (req,res) => {
    try {
        const allTracks = await Track.find()
        res.status(200).json(allTracks)
    } catch (error) {
        res.status(400).json(error)
    }
}

export const getTracktById = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id)
        res.status(200).json(track)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}


export const updateTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, img } = req.body;

    const track = await Track.findById(id);

    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    // Actualizar campos si vienen en el body
    if (name !== undefined) track.name = name;
    if (country !== undefined) track.country = country;
    if (img !== undefined) track.img = img;

    // Si viene imagen por multer
    if (req.file) {
      const { filename } = req.file;
      track.setImgUrl(filename);
    }

    const updatedTrack = await track.save();

    return res.status(200).json(updatedTrack); 
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};


export const deleteTrack = async (req, res) => {
  try {
    const { id } = req.params;

    const track = await Track.findByIdAndDelete(id);

    if (!track) {
      return res.status(404).json({ message: "track not found" });
    }

    return res.status(200).json({
      message: "track deleted successfully",
      track,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};