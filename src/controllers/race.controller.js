import Race from "../models/race.model";
import Prediction from "../models/prediction.model.js";
import calculatePoints from "../utils/calculatePoints.js";
import User from "../models/user.model.js"

export const createRace = async (req, res) => {
    try {
        console.log(req.body)
        const { name, circuit, date, status, pilots, cutoff } = req.body
        const newRace = new Race({ name, circuit, date, status, pilots, cutoff })

        const newRaceSaved = await newRace.save();
        res.status(200).json(newRaceSaved)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}


export const getAllRaces = async (req, res) => {
    try {
        const allRaces = await Race.find()
        res.status(200).json(allRaces)
    } catch (error) {
        res.status(400).json(error)
    }
}

export const getRaceById = async (req, res) => {
    try {
        const race = await Race.findById(req.params.id)
        res.status(200).json(race)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}


export const updateRace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, circuit, date, status, pilots, cutoff } = req.body;

        const race = await Race.findById(id);

        if (!race) {
            return res.status(404).json({ message: "Pilot not found" });
        }

        // Actualizar campos si vienen en el body
        if (name !== undefined) race.name = name;
        if (circuit !== undefined) race.circuit = circuit;
        if (date !== undefined) race.date = date;
        if (status !== undefined) race.status = status;
        if (pilots !== undefined) race.pilots = pilots;
        if (cutoff !== undefined) race.cutoff = cutoff;

        const updatedRace = await race.save();

        return res.status(200).json(updatedRace);
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: error });
    }
};


export const deleteRace = async (req, res) => {
    try {
        const deletedRace = await Race.findByIdAndDelete(req.params.id)
        res.status(200).json({ messagge: 'eliminado correctamente' })
    } catch (error) {
        res.status(400).json({ error: error.messagge })
    }
}


export const closeRace = async (req, res) => {
    try {
        const { id } = req.params;
        const { result } = req.body;

        const race = await Race.findById(id);
        if (!race) {
            return res.status(404).json({ message: "Race not found" });
        }

        if (race.status !== "upcoming") {
            return res.status(400).json({ message: "Race already closed" });
        }

        // Guardar resultado oficial
        race.result = result;
        race.status = "closed";
        await race.save();

        // Traer todos los pronósticos de esa carrera
        const predictions = await Prediction.find({ race: id });

        for (const prediction of predictions) {
            const points = calculatePoints(
                prediction.positions,
                result
            );

            prediction.points = points;
            prediction.processed = true;
            await prediction.save();

            // sumar puntos al usuario
            await User.findByIdAndUpdate(
                prediction.user,
                { $inc: { points } }
            );
        }

        race.status = "processed";
        await race.save();

        return res.status(200).json({
            message: "Race closed and points calculated",
            predictionsProcessed: predictions.length
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};
