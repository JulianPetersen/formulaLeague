import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token no proporcionado." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // guardamos el user en req
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth Middleware error:", error);

    return res.status(401).json({ message: "Token inválido o expirado." });
  }
};
