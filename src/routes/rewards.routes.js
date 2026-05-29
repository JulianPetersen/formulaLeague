import { Router } from "express";
import * as rewardCtrl from  "../controllers/rewards.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";


const router = Router();

router.post("/",authMiddleware,rewardCtrl.rewardAd );

router.get(
  '/reward-status',
  authMiddleware,
  rewardCtrl.getRewardStatus
);
export default router; 
