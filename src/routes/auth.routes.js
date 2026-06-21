import { Router } from "express";
import { register, login,verifyEmail ,resendVerification,forgotPassword,resetPassword,googleLogin} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/resendVerify", resendVerification);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);
router.post("/google", googleLogin);
router.get("/verify", verifyEmail);

export default router;
