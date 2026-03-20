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
      .select("name points username");

    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const setUsername = async (req, res) => {
  try {

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username requerido" });
    }

    // verificar que no exista
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: "El username ya está en uso" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username },
      { new: true }
    )

    res.status(200).json(user);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al actualizar username" });
  }
};



export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ]
    };

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      data: users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });

  } catch (error) {
    console.log(error);
  }
};