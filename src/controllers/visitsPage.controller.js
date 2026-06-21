import Visits from "../models/visits.model";


export const createVisit = async (req, res) => {
    try {

        const { page } = req.body;

        const visit = await Visits.findOneAndUpdate(
            { page },
            { $inc: { count: 1 } },
            {
                new: true,
                upsert: true
            }
        );

        return res.status(200).json(visit);

    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};


export const getVisitsByPage = async (req, res) => {
    try {
        const { page } = req.params
        const visitspage = await Visits.findOne({ page: page })
        res.status(200).json(visitspage)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}