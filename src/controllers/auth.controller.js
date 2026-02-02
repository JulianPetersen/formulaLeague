import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validaciones simples (sin Joi)
    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son obligatorios." });
    }

    // Verificar si ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "El email ya está registrado." });
    }

    // Hash del password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Crear user
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "user"
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación simple
    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son obligatorios." });
    }

    // Buscar el usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Credenciales inválidas." });
    }

    // Comparar contraseña
    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ message: "Credenciales inválidas." });
    }

    // Crear token JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login exitoso.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};
