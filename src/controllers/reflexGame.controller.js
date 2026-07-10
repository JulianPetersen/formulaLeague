import ReflexGame from "../models/reflexGame.model.js";
import { saveLog } from '../utils/logs';
import { getWeekId } from "../utils/getWeekId.js";

const TOTAL_ATTEMPTS = 5;

const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

export const createReflexGameRecord = async (req, res) => {
  try {
    const { bestResult, averageResult, attempts, misses } = req.body;

    if (attempts !== TOTAL_ATTEMPTS) {
      return res.status(400).json({ message: `La partida debe tener ${TOTAL_ATTEMPTS} intentos` });
    }

    if (!Number.isInteger(misses) || misses < 0 || misses > TOTAL_ATTEMPTS) {
      return res.status(400).json({ message: 'La cantidad de fallos no es valida' });
    }

    if (misses >= TOTAL_ATTEMPTS) {
      return res.status(400).json({ message: 'La partida no tiene intentos validos para rankear' });
    }

    if (!isPositiveNumber(bestResult) || !isPositiveNumber(averageResult)) {
      return res.status(400).json({ message: 'Los tiempos deben ser numeros positivos' });
    }

    if (bestResult > averageResult) {
      return res.status(400).json({ message: 'El mejor tiempo no puede ser mayor al promedio' });
    }

    const user = req.user.id;
    const newRecord = new ReflexGame({
      user,
      bestResult,
      averageResult,
      attempts,
      misses,
      week: getWeekId()
    });

    const savedRecord = await newRecord.save();

    saveLog({
      type: 'Create-Reflex-Game-Record',
      message: 'Se crea nuevo record de Reflejos Pit Stop',
      user,
      status: 'INFO'
    });

    return res.status(200).json(savedRecord);
  } catch (error) {
    return res.status(400).json({ message: error.message || error });
  }
};

export const getBestReflexRecords = async (req, res) => {
  try {
    const weekId = getWeekId();

    const records = await ReflexGame.aggregate([
      {
        $match: {
          week: weekId,
          attempts: TOTAL_ATTEMPTS,
          averageResult: { $gt: 0 },
          bestResult: { $gt: 0 },
          misses: { $lt: TOTAL_ATTEMPTS }
        }
      },
      {
        $sort: {
          averageResult: 1,
          misses: 1,
          bestResult: 1,
          createdAt: 1
        }
      },
      {
        $group: {
          _id: "$user",
          bestSession: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$bestSession" }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
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
          userId: "$user",
          name: "$userData.username",
          bestResult: 1,
          averageResult: 1,
          attempts: 1,
          misses: 1,
          week: 1,
          createdAt: 1
        }
      },
      {
        $sort: {
          averageResult: 1,
          misses: 1,
          bestResult: 1,
          createdAt: 1
        }
      }
    ]);

    return res.status(200).json(records);
  } catch (error) {
    return res.status(400).json({ message: error.message || error });
  }
};

export const getMyBestReflexRecord = async (req, res) => {
  try {
    const record = await ReflexGame.findOne({
      user: req.user.id,
      week: getWeekId(),
      attempts: TOTAL_ATTEMPTS,
      misses: { $lt: TOTAL_ATTEMPTS }
    }).sort({
      averageResult: 1,
      misses: 1,
      bestResult: 1,
      createdAt: 1
    });

    if (!record) {
      return res.status(404).json({ message: 'No hay resultados para esta semana' });
    }

    return res.status(200).json(record);
  } catch (error) {
    return res.status(400).json({ message: error.message || error });
  }
};
