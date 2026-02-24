import User from "../models/user.model";


export const getInfoUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        res.status(200).json(user)
        console.log(user)
    } catch (error) {
        console.log(error)
    }

}