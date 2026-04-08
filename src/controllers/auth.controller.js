import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import 'dotenv/config';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son obligatorios." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "El email ya está registrado." });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // 🔐 TOKEN
    const token = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "user",
      verified: false,
      verifyToken: token,
      verifyTokenExpires: Date.now() + 1000 * 60 * 60 * 24 // 24 horas
    });

    // 🔗 LINK (IMPORTANTE: usar tu dominio real)
    const link = `https://formulaleague.site/verify?token=${token}`;

    // 📧 MAIL con SendGrid
    await sgMail.send({
      to: email,
      from: 'no-reply@formulaleague.site', // ⚠️ debe estar verificado
      subject: 'Verificá tu cuenta',
      html: `
        <h2>Hola ${name}</h2>
        <p>Hacé click para verificar tu cuenta:</p>
        <a href="${link}">Verificar cuenta</a>
      `
    });

    return res.status(201).json({
      message: "Usuario registrado. Revisá tu email para verificar la cuenta."
    });

  } catch (error) {
    console.error("SENDGRID ERROR:", error.response?.body || error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};


export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json("Token inválido o expirado");
    }

    user.verified = true;
    user.verifyToken = null;
    user.verifyTokenExpires = null;

    await user.save();

    res.status(200).json("Cuenta verificada correctamente");
  } catch (error) {
    res.status(500).json("Error en el servidor");
  }
};


export const login = async (req, res) => {
  try {
    console.log(req.body.email)
    const { email, password } = req.body;

    // Validación simple
    if (!email || !password) {
      console.log('credenciales invalidas')
      return res.status(400).json({ message: "Email y password son obligatorios." });
    }

    // Buscar el usuario
    const user = await User.findOne({ email });
    if (!user) {
      console.log('credenciales invalidas 2')
      return res.status(400).json({ message: "Credenciales inválidas." });
    }

    // Comparar contraseña
    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      console.log('credenciales invalidas 3')
      return res.status(400).json({ message: "Credenciales inválidas." });
    }

    if (!user.verified) {
      return res.status(401).json({
        message: "Debes verificar tu email antes de iniciar sesión"
      });
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
        role: user.role,
        verified: user.verified
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};
