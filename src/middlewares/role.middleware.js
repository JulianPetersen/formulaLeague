export const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "No tenés permisos para acceder a esta ruta."
        });
      }

      next();
    } catch (error) {
      console.error("Role Middleware error:", error);
      return res.status(500).json({ message: "Error en permisos." });
    }
  };
};
