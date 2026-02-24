import Pilot from "../models/pilot.model";


export const createPilot = async (req, res) => {
    try {
        console.log(req.body)
        const { name,number,team,country,img } = req.body
        const newPilot = new Pilot({ name,number,team,country,img })
        if (req.file) {
            const { filename } = req.file;
            newPilot.setImgUrl(filename)
        }
        const newPilotSaved = await newPilot.save();
        res.status(200).json(newPilotSaved)
    } catch (error) {
        res.status(400).json({messagge:error})
    }
}


export const getAllPilots = async (req,res) => {
    try {
        const allPilots = await Pilot.find()
        .populate('team')
        res.status(200).json(allPilots)
    } catch (error) {
        res.status(400).json(error)
    }
}

export const getPilotById = async (req, res) => {
    try {
        const pilot = await Pilot.findById(req.params.id)
        res.status(200).json(pilot)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}


export const updatePilot = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, number, team, country, img } = req.body;

    const pilot = await Pilot.findById(id);

    if (!pilot) {
      return res.status(404).json({ message: "Pilot not found" });
    }

    // Actualizar campos si vienen en el body
    if (name !== undefined) pilot.name = name;
    if (number !== undefined) pilot.number = number;
    if (team !== undefined) pilot.team = team;
    if (country !== undefined) pilot.country = country;
    if (img !== undefined) pilot.img = img;

    // Si viene imagen por multer
    if (req.file) {
      const { filename } = req.file;
      pilot.setImgUrl(filename);
    }

    const updatedPilot = await pilot.save();

    return res.status(200).json(updatedPilot);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};


export const deletePilot = async (req, res) => {
  try {
    const { id } = req.params;

    const pilot = await Pilot.findByIdAndDelete(id);

    if (!pilot) {
      return res.status(404).json({ message: "Pilot not found" });
    }

    return res.status(200).json({
      message: "Pilot deleted successfully",
      pilot,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};