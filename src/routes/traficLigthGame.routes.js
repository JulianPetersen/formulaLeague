import { Router } from "express";
import * as trafficLightGame from  "../controllers/traficLigth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/",authMiddleware,trafficLightGame.createNewRecord);
router.get("/",authMiddleware,trafficLightGame.getAllRecords);
router.get("/best-records", authMiddleware,trafficLightGame.getBestRecordEachUser);
router.get("/:userId",authMiddleware,trafficLightGame.getRecordByUser);

export default router;  