import TraficLigth from "../models/trafficLightGame.js";
import WeeklyReward from "../models/weeklyReward.model.js";
import User from "../models/user.model.js";
import { saveLog } from '../utils/logs';
import { getWeekId, getPreviousWeekId } from "../utils/getWeekId.js";

export const createNewRecord = async (req, res) => {
  try {
    console.log(req.body)
    const { bestResult } = req.body
    const user = req.user.id;
    const newRecord = new TraficLigth({ user, bestResult, week: getWeekId() })
    saveLog({
      type: 'Create-Record',
      message: 'se crea nuevo record de traficLigth',
      user,
      status: 'INFO'
    })

    const newRecordGame = await newRecord.save();
    res.status(200).json(newRecordGame)
  } catch (error) {
    res.status(400).json({ message: error })
  }
}


export const getAllRecords = async (req, res) => {
  try {
    const allRecords = await TraficLigth.find()
    res.status(200).json(allRecords)
  } catch (error) {
    res.status(400).json(error)
  }
}

export const getRecordByUser = async (req, res) => {
  try {
    const record = await TraficLigth.find({ user: req.params.userId })
    res.status(200).json(record)
  } catch (error) {
    res.status(400).json(error)
  }
}


export const getBestRecordEachUser = async (req, res) => {
  try {
    const weekId = getWeekId();
    console.log(weekId)
    const records = await TraficLigth.aggregate([
      {
        $match: { week: weekId }
      },
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
          name: "$userData.username",
          bestResult: 1
        }
      },
      {
        $sort: { bestResult: 1 }
      }
    ]);

    res.status(200).json(records);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const processWeeklyRewards = async () => {
  try {
    console.log('procesando semana');

    // IMPORTANTE:
    // procesamos la semana anterior
    const weekId = getPreviousWeekId();

    // evitar duplicados
    const alreadyProcessed = await WeeklyReward.findOne({ week: weekId });

    if (alreadyProcessed) {
      console.log("Semana ya procesada");
      return;
    }

    const ranking = await TraficLigth.aggregate([
      { $match: { week: weekId } },
      {
        $group: {
          _id: "$user",
          bestResult: { $min: "$bestResult" }
        }
      },
      { $sort: { bestResult: 1 } },
      { $limit: 3 }
    ]);

    if (!ranking.length) {
      console.log("No hay datos");
      return;
    }

    const rewards = [10, 5, 2];

    for (let i = 0; i < ranking.length; i++) {
      await User.findByIdAndUpdate(ranking[i]._id, {
        $inc: { credits: rewards[i] }
      });
    }

    await WeeklyReward.create({ week: weekId });

    saveLog({
      type: 'JOB-ENTREGA-PUNTOS-SEMAFORO',
      message: `Premios entregados para ${weekId}`,
      status: 'INFO'
    });

    console.log("Premios otorgados correctamente");

  } catch (error) {
    console.error(error);

    saveLog({
      type: 'JOB-ERROR-ENTREGA.PUNTOS-SEMAFORO',
      message: `Hubo un error en la entrega de puntos: ${error.message}`,
      status: 'ERROR'
    });
  }
};