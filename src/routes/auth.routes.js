import { Router } from "express";
import { register, login,verifyEmail ,resendVerification} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/resendVerify", resendVerification);
router.get("/verify", verifyEmail);
export default router;
