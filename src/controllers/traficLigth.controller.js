import TraficLigth from "../models/trafficLightGame.js";


export const createNewRecord = async (req, res) => {
    try {
        console.log(req.body)
        const {bestResult } = req.body
        const user = req.user.id;
        const newRecord = new TraficLigth({ user,bestResult })

        const newRecordGame = await newRecord.save();
        res.status(200).json(newRecordGame)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}


export const getAllRecords = async (req,res) => {
    try {
        const allRecords = await TraficLigth.find()
        res.status(200).json(allRecords)
    } catch (error) {
        res.status(400).json(error)
    }
}

export const getRecordByUser = async (req,res) => {
    try {
        const record = await TraficLigth.find({user:req.params.userId})
        res.status(200).json(record)
    } catch (error) {
        res.status(400).json(error)
    }
}


export const getBestRecordEachUser = async (req, res) => {
  try {
    const records = await TraficLigth.aggregate([
      {
        $group: {
          _id: "$user",
          bestResult: { $min: "$bestResult" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userData"
        }
      },
      {
        $unwind: "$userData"
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$userData.name",
          bestResult: 1
        }
      },
      {
        $sort: { bestTime: 1 }
      }
    ]);

    res.status(200).json(records);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};