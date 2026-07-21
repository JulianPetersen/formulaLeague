import { Router } from "express";
import * as raceMindRush from "../controllers/raceMindRush.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, raceMindRush.createRaceMindRushRecord);
router.get("/best-records", authMiddleware, raceMindRush.getBestRaceMindRushRecords);
router.get("/me", authMiddleware, raceMindRush.getMyBestRaceMindRushRecord);
router.get("/reward-status", authMiddleware, raceMindRush.getRaceMindRushRewardStatus);

export default router;