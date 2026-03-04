import Prize from "../models/prize.model";


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



        const updatedPrize = await prize.save();

        return res.status(200).json(updatedPrize);
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: error });
    }
};


export const changeStatusToActive = async (req, res) => {

    try {
        const { id } = req.params;
        const { status } = req.body

        const prizeActive = await Prize.findOne({ status: 'activo' })

        if (prizeActive) {
            return res.status(400).json({ message: 'ya hay un premio activo en este momento, no es posible activar otro' })
        }

        const prize = await Prize.findById(id);

        if (!prize) {
            return res.status(404).json({ message: "no se encontro un premio con este ID" });
        }

        if (status !== undefined) prize.status = status;


        const updatedPrize = await prize.save();

        return res.status(200).json(updatedPrize);
    } catch (error) {
         res.status(400).json({ messagge: error })
    }

}






export const getActivedPrize = async (req, res) => {
    try {
        const activedPrize = await Prize.findOne({ status: "activo" })

        if (!activedPrize) {
            res.status(400).json({ messagge: 'No hay un premio activo por el momento' })
        }
        res.status(200).json(activedPrize)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}

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
