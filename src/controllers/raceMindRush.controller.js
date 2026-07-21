import RaceMindRush from "../models/raceMindRush.model.js";
import WeeklyReward from "../models/weeklyReward.model.js";
import User from "../models/user.model.js";
import { saveLog } from '../utils/logs';
import { getPreviousWeekId, getWeekId } from "../utils/getWeekId.js";

const GAME = 'race-mind-rush';
const DAILY_RM_LIMIT = 20;
const WEEKLY_REWARDS = [3, 2, 1];

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const getEarnedRmByScore = (score) => {
  if (score < 1500) return 0;
  if (score < 2500) return 1;
  if (score < 3500) return 2;
  if (score < 4500) return 3;
  if (score < 6000) return 4;

  return 5;
};

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const validateSession = ({ score, distance, coinsCollected, durationMs }) => {
  if (!Number.isInteger(score) || score < 0) {
    return 'El score no es valido';
  }

  if (!isFiniteNumber(distance) || distance < 0) {
    return 'La distancia no es valida';
  }

  if (!Number.isInteger(coinsCollected) || coinsCollected < 0) {
    return 'La cantidad de RM juntadas no es valida';
  }

  if (!Number.isInteger(durationMs) || durationMs < 1000 || durationMs > 10 * 60 * 1000) {
    return 'La duracion de la partida no es valida';
  }

  const durationSeconds = durationMs / 1000;
  const maxReasonableScore = 300 + durationSeconds * 260;
  const maxReasonableDistance = 80 + durationSeconds * 35;

  if (score > maxReasonableScore) {
    return 'El score no coincide con la duracion de la partida';
  }

  if (distance > maxReasonableDistance) {
    return 'La distancia no coincide con la duracion de la partida';
  }

  if (coinsCollected * 100 > score + 100) {
    return 'La cantidad de RM juntadas no coincide con el score';
  }

  return null;
};

const buildBestRecordsPipeline = (weekId, match = {}) => [
  {
    $match: {
      week: weekId,
      score: { $gte: 0 },
      ...match
    }
  },
  {
    $sort: {
      score: -1,
      distance: -1,
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
      recordId: "$_id",
      userId: "$user",
      name: "$userData.username",
      score: 1,
      distance: 1,
      coinsCollected: 1,
      earnedRm: 1,
      creditedRm: 1,
      week: 1,
      createdAt: 1
    }
  },
  {
    $sort: {
      score: -1,
      distance: -1,
      createdAt: 1
    }
  }
];

export const createRaceMindRushRecord = async (req, res) => {
  try {
    const {
      score,
      distance,
      coinsCollected = 0,
      durationMs,
      startedAt,
      endedAt
    } = req.body;

    const validationError = validateSession({ score, distance, coinsCollected, durationMs });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const userId = req.user.id;
    const { start, end } = getTodayRange();
    const earnedRm = getEarnedRmByScore(score);

    const todayRecords = await RaceMindRush.find({
      user: userId,
      createdAt: { $gte: start, $lt: end }
    }).select('creditedRm');

    const dailyEarnedBefore = todayRecords.reduce((total, record) => total + (record.creditedRm || 0), 0);
    const remainingDailyRm = Math.max(0, DAILY_RM_LIMIT - dailyEarnedBefore);
    const creditedRm = Math.min(earnedRm, remainingDailyRm);

    const record = await RaceMindRush.create({
      user: userId,
      score,
      distance: Math.round(distance),
      coinsCollected,
      durationMs,
      earnedRm,
      creditedRm,
      week: getWeekId(),
      startedAt: startedAt ? new Date(startedAt) : undefined,
      endedAt: endedAt ? new Date(endedAt) : new Date()
    });

    if (creditedRm > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { credits: creditedRm }
      });
    }

    const ranking = await RaceMindRush.aggregate(buildBestRecordsPipeline(getWeekId()));
    const rankingPosition = ranking.findIndex((item) => item.userId.toString() === userId) + 1;
    const bestRecord = ranking.find((item) => item.userId.toString() === userId);

    saveLog({
      type: 'Create-Race-Mind-Rush-Record',
      message: `Se crea record de Race Mind Rush. Score ${score}, RM acreditadas ${creditedRm}`,
      user: userId,
      status: 'INFO'
    });

    return res.status(200).json({
      record,
      earnedRm,
      creditedRm,
      dailyLimit: DAILY_RM_LIMIT,
      dailyEarnedBefore,
      dailyEarnedAfter: dailyEarnedBefore + creditedRm,
      rankingPosition: rankingPosition || null,
      isWeeklyBest: bestRecord?.recordId?.toString() === record._id.toString()
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || error });
  }
};

export const getBestRaceMindRushRecords = async (req, res) => {
  try {
    const records = await RaceMindRush.aggregate(buildBestRecordsPipeline(getWeekId()));

    return res.status(200).json(records);
  } catch (error) {
    return res.status(400).json({ message: error.message || error });
  }
};

export const getMyBestRaceMindRushRecord = async (req, res) => {
  try {
    const record = await RaceMindRush.findOne({
      user: req.user.id,
      week: getWeekId()
    }).sort({
      score: -1,
      distance: -1,
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

export const getRaceMindRushRewardStatus = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const records = await RaceMindRush.find({
      user: req.user.id,
      createdAt: { $gte: start, $lt: end }
    }).select('creditedRm');

    const dailyEarned = records.reduce((total, record) => total + (record.creditedRm || 0), 0);

    return res.status(200).json({
      dailyLimit: DAILY_RM_LIMIT,
      dailyEarned,
      dailyRemaining: Math.max(0, DAILY_RM_LIMIT - dailyEarned)
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || error });
  }
};

export const processWeeklyRaceMindRushRewards = async () => {
  try {
    console.log('procesando premios semanales de Race Mind Rush');

    const weekId = getPreviousWeekId();
    const alreadyProcessed = await WeeklyReward.findOne({ week: weekId });

    if (alreadyProcessed?.games?.includes(GAME)) {
      console.log("Semana de Race Mind Rush ya procesada");
      return;
    }

    const ranking = await RaceMindRush.aggregate([
      ...buildBestRecordsPipeline(weekId),
      { $limit: 3 }
    ]);

    if (!ranking.length) {
      console.log("No hay datos de Race Mind Rush");
      return;
    }

    for (let i = 0; i < ranking.length; i++) {
      await User.findByIdAndUpdate(ranking[i].userId, {
        $inc: { credits: WEEKLY_REWARDS[i] }
      });
    }

    await WeeklyReward.findOneAndUpdate(
      { week: weekId },
      { $addToSet: { games: GAME }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );

    saveLog({
      type: 'JOB-ENTREGA-PUNTOS-RACE-MIND-RUSH',
      message: `Premios de Race Mind Rush entregados para ${weekId}`,
      status: 'INFO'
    });

    console.log("Premios de Race Mind Rush otorgados correctamente");
  } catch (error) {
    console.error(error);

    saveLog({
      type: 'JOB-ERROR-ENTREGA-PUNTOS-RACE-MIND-RUSH',
      message: `Hubo un error en la entrega de puntos de Race Mind Rush: ${error.message}`,
      status: 'ERROR'
    });
  }
};
