import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import 'dotenv/config';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const register = async (req, res) => {
  try {
    const { username, email, password, role, aceptTerms } = req.body;

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
      username,
      email,
      passwordHash,
      role: role || "user",
      verified: false,
      verifyToken: token,
      // verifyTokenExpires: Date.now() + 1000 * 60, // 1 minuto
      verifyTokenExpires: Date.now() + 1000 * 60 * 60 * 24, // 24 horas
      aceptTerms:aceptTerms,
    });

    // 🔗 LINK (IMPORTANTE: usar tu dominio real)
    const link = `https://formulaleague.site/verify?token=${token}`;

    // 📧 MAIL con SendGrid
    await sgMail.send({
      to: email,
      from: 'no-reply@formulaleague.site', // ⚠️ debe estar verificado
      subject: 'Verificá tu cuenta',
      html: `
        <h2>Hola ${username}</h2>
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
        name: user.username,
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


export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "El email es obligatorio." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (user.verified) {
      return res.status(400).json({ message: "La cuenta ya está verificada." });
    }

    // 🔐 generar nuevo token
    const token = crypto.randomBytes(32).toString('hex');

    user.verifyToken = token;
    user.verifyTokenExpires = Date.now() + 1000 * 60 * 60 * 24; // 24h

    await user.save();

    // 🔗 LINK (igual que en register)
    const link = `https://formulaleague.site/verify?token=${token}`;

    // 📧 MAIL con SendGrid
    await sgMail.send({
      to: email,
      from: 'no-reply@formulaleague.site',
      subject: 'Verificá tu cuenta',
      html: `
        <h2>Hola ${user.username || ''}</h2>
        <p>Solicitaste reenviar el email de verificación.</p>
        <p>Hacé click acá:</p>
        <a href="${link}">Verificar cuenta</a>
        <p>Este enlace expira en 24 horas.</p>
      `
    });

    return res.status(200).json({
      message: "Email de verificación reenviado."
    });

  } catch (error) {
    console.error("SENDGRID ERROR:", error.response?.body || error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('entrando al metodo', email)
    if (!email) {
      return res.status(400).json({ message: "El email es obligatorio." });
    }

    const user = await User.findOne({ email });

    // 🔒 No revelar si existe o no
    if (!user) {
      return res.status(200).json({ 
        message: "Si el email existe, se enviaron instrucciones."
      });
    }

    // 🔐 TOKEN
    const token = crypto.randomBytes(32).toString('hex');

    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 1000 * 60 * 60; // 1 hora

    console.log(user)

    await user.save();

    // 🔗 LINK
    const link = `https://formulaleague.site/reset-password?token=${token}`;

    // 📧 MAIL con SendGrid
    await sgMail.send({
      to: email,
      from: 'no-reply@formulaleague.site',
      subject: 'Recuperar contraseña',
      html: `
        <h2>Recuperación de contraseña</h2>
        <p>Hacé click en el botón para crear una nueva contraseña:</p>
        <a href="${link}">Restablecer contraseña</a>
        <p>Este enlace expira en 1 hora.</p>
      `
    });

    return res.status(200).json({
      message: "Si el email existe, se enviaron instrucciones."
    });

  } catch (error) {
    console.error("SENDGRID ERROR:", error.response?.body || error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Datos incompletos." });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Token inválido o expirado."
      });
    }

    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(password, salt);

    // limpiar token
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: "Contraseña actualizada correctamente."
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};