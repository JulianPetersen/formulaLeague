import Prediction from "../models/prediction.model";
import Race from '../models/race.model'
import { saveLog } from '../utils/logs';
import User from '../models/user.model';

const MODIFICATION_COST = 10;


export const createPrediction = async (req, res) => {
  try {
    const { raceId } = req.params;
    const userId = req.user.id;
    const { positions } = req.body;

    console.log(raceId)

    const race = await Race.findById(raceId);

    if (!race) {
      return res.status(404).json({ message: "Race not found" });
    }

    if (race.cutoff && new Date() > new Date(race.cutoff)) {
      return res.status(400).json({ message: "Prediction time is over" });
    }

    if (race.status !== "lista") {
      return res.status(400).json({ message: "Race is not open for predictions" });
    }

    const validationError = validatePositions(positions);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const exists = await Prediction.findOne({ race: raceId, user: userId });
    if (exists) {
      return res.status(400).json({ message: "Prediction already exists" });
    }

    const prediction = await Prediction.create({
      race: raceId,
      user: userId,
      positions,
    });

    return res.status(201).json(prediction);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};


export const getPredictionsByRace = async (req, res) => {
  try {
    const { raceId } = req.params;

    const predictions = await Prediction.find({ race: raceId })
      .populate("user", "name email")
      .populate("positions.pilot", "name number team");

    return res.status(200).json(predictions);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

//mi prediccion para una carrera
export const getMyPredictionByRace = async (req, res) => {
  try {
    console.log(req.user)
    const { raceId } = req.params;
    const userId = req.user.id;

    const prediction = await Prediction.findOne({
      race: raceId,
      user: userId,
    }).populate("positions.pilot", "name number team");

    if (!prediction) {
      return res.status(404).json({ message: "Prediction not found" });
    }
    return res.status(200).json(prediction);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};


export const getMyAllPrediction = async (req, res) => {
  try {
    console.log(req.user)

    const userId = req.user.id;

    const prediction = await Prediction.find({
      user: userId,
    }).populate("positions.pilot", "name number team");

    if (!prediction) {
      return res.status(404).json({ message: "Prediction not found" });
    }

    return res.status(200).json(prediction);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};


export const validatePositions = (positions, maxPositions = 22) => {
  if (!Array.isArray(positions)) {
    return "Positions must be an array";
  }

  if (positions.length === 0) {
    return "Positions cannot be empty";
  }

  const usedPositions = new Set();
  const usedPilots = new Set();

  for (const item of positions) {
    const { pilot, position } = item;

    if (!pilot || position === undefined) {
      return "Each position must include pilot and position";
    }

    if (typeof position !== "number") {
      return "Position must be a number";
    }

    if (position < 1 || position > maxPositions) {
      return `Position must be between 1 and ${maxPositions}`;
    }

    if (usedPositions.has(position)) {
      return "Duplicate positions are not allowed";
    }

    if (usedPilots.has(String(pilot))) {
      return "Duplicate pilots are not allowed";
    }

    usedPositions.add(position);
    usedPilots.add(String(pilot));
  }

  return null; // ✅ Todo OK
};
 

export const modifyPrediction = async (req, res) => {
  try {

    const { raceId } = req.params;
    const userId = req.user.id;
    const { positions } = req.body;

    const race = await Race.findById(raceId);

    if (!race) {
      return res.status(404).json({
        message: "Race not found"
      });
    }

    // validar cierre
    if (race.cutoff && new Date() > new Date(race.cutoff)) {
      return res.status(400).json({
        message: "El tiempo de prediccion se termino"
      });
    }

    // validar estado
    if (race.status !== "lista") {
      return res.status(400).json({
        message: "Carrera no está abierta"
      });
    }

    // validar posiciones
    const validationError = validatePositions(positions);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    // buscar usuario
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // validar créditos
    if (user.credits < MODIFICATION_COST) {
      return res.status(400).json({
        message: "No tienes creditos Suficientes"
      });
    }

    // buscar prediction
    const prediction = await Prediction.findOne({
      race: raceId,
      user: userId
    });

    if (!prediction) {
      return res.status(404).json({
        message: "No tienes una prediccion para esta carrera"
      });
    }

    // descontar créditos
    user.credits -= MODIFICATION_COST;

    await user.save();

    // actualizar prediction
    prediction.positions = positions;

    await prediction.save();

    // logs
    await saveLog({
      user: userId,
      action: 'modify_prediction',
      description: `Modified prediction for race ${raceId}`
    });

    return res.status(200).json({
      message: "Prediction updated",
      creditsLeft: user.credits,
      prediction
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: error.message
    });
  }
};