import Prize from "../models/prize.model";
import User from "../models/user.model";
import { saveLog } from "../utils/logs";
import { depositPrizeToWinner } from "../utils/wallet";
import { closeSeasonForPrize } from "../utils/season";

const getSeasonWinner = async () => {
    return User.findOne()
        .sort({ points: -1, createdAt: 1 })
        .select("_id points username email");
};

const assignWinnerIfClosing = async (prize, requestedStatus, manualWinner) => {
    if (requestedStatus !== "cerrado" || manualWinner || prize.winner) {
        return;
    }

    const winner = await getSeasonWinner();

    if (!winner) {
        throw new Error("No hay usuarios para asignar como ganador del premio");
    }

    prize.winner = winner._id;

    await saveLog({
        type: "PRIZE-WINNER-ASSIGNED",
        message: `Ganador asignado automaticamente al premio ${prize._id}. Usuario ${winner._id} con ${winner.points || 0} puntos`,
        user: winner._id,
        status: "INFO"
    });
};


export const createNewPrize = async (req, res) => {
    try {

        const { amount, winner, endDate, status } = req.body
        const newPrize = new Prize({ amount, winner, endDate, status })
        const newPrizeSaved = await newPrize.save();
        res.status(200).json(newPrizeSaved)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}


export const updatePrize = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, winner, endDate, status } = req.body

        const prize = await Prize.findById(id);

        if (!prize) {
            return res.status(404).json({ message: "no se encontro un premio con este ID" });
        }

        // Actualizar campos si vienen en el body
        if (amount !== undefined) prize.amount = amount;
        if (winner !== undefined) prize.winner = winner;
        if (endDate !== undefined) prize.endDate = endDate;
        if (status !== undefined) prize.status = status;

        await assignWinnerIfClosing(prize, status, winner);

        const updatedPrize = await prize.save();

        await depositPrizeToWinner(updatedPrize);
        await closeSeasonForPrize(updatedPrize);

        return res.status(200).json(updatedPrize);
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: error.message || error });
    }
};


export const changeStatusToActive = async (req, res) => {

    try {
        const { id } = req.params;
        const { status } = req.body

        const prizeActive = await Prize.findOne({ status: 'activo', _id: { $ne: id } })

        if (status === 'activo' && prizeActive) {
            return res.status(400).json({ message: 'ya hay un premio activo en este momento, no es posible activar otro' })
        }

        const prize = await Prize.findById(id);

        if (!prize) {
            return res.status(404).json({ message: "no se encontro un premio con este ID" });
        }

        if (status !== undefined) prize.status = status;

        await assignWinnerIfClosing(prize, status);

        const updatedPrize = await prize.save();

        await depositPrizeToWinner(updatedPrize);
        await closeSeasonForPrize(updatedPrize);

        return res.status(200).json(updatedPrize);
    } catch (error) {
         res.status(400).json({ message: error.message || error })
    }

}






export const getActivedPrize = async (req, res) => {
  try {
    const activePrize = await Prize.findOne({ status: "activo" }).sort({ createdAt: -1 });

    if (activePrize) {
      return res.status(200).json(activePrize);
    }

    const closedPrize = await Prize.findOne({ status: "cerrado" }).sort({ updatedAt: -1 });

    if (closedPrize) {
      return res.status(200).json(closedPrize);
    }

    const upcomingPrize = await Prize.findOne({ status: "proximamente" }).sort({ createdAt: -1 });

    if (upcomingPrize) {
      return res.status(200).json(upcomingPrize);
    }

    return res.status(404).json({
      message: "No hay premio disponible por el momento"
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || error
    });
  }
};

export const getAllPrizes = async (req, res) => {
    try {
        const allPrizes = await Prize
            .find()
            .sort({ createdAt: -1 }) // más nuevos primero

        res.status(200).json(allPrizes)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
