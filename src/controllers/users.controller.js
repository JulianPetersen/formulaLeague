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


export const getTopUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ points: -1 })
      .limit(10)
      .select("name points");

    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};