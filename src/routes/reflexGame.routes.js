import { Router } from "express";
import * as reflexGame from "../controllers/reflexGame.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, reflexGame.createReflexGameRecord);
router.get("/best-records", authMiddleware, reflexGame.getBestReflexRecords);
router.get("/me", authMiddleware, reflexGame.getMyBestReflexRecord);

export default router;
