import VersionApp from "../models/versionApp.model.js";

export const createNewVersion = async (req, res) => {
    try {
        console.log(req.body)
        const {latestVersion,foce,message } = req.body
        const newVersion = new VersionApp({ latestVersion,foce,message })
        const versionSaved=  await newVersion.save();
        res.status(200).json(versionSaved)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}


export const getAllVersions = async (req,res) => {
    try {
        const allVersions = await VersionApp.find()
          .sort({ createdAt: -1 });
        res.status(200).json(allVersions)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}


export const getLatestVersion = async (req, res) => {
  try {

    const latestVersion = await VersionApp.findOne()
      .sort({ createdAt: -1 });

    if (!latestVersion) {
      return res.status(404).json({
        message: 'No hay versiones registradas'
      });
    }

    res.status(200).json(latestVersion);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};