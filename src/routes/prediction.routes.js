import { Router } from "express";
import * as predictionCtrl from  "../controllers/prediction.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/:raceId",authMiddleware, roleMiddleware(["admin", "moderator"]),predictionCtrl.createPrediction);
router.get("/get-by-race/:raceId", predictionCtrl.getPredictionsByRace);
router.get("/mi-predictions",authMiddleware, predictionCtrl.getMyAllPrediction);
router.get("/mi-prediction-by-race/:raceId",authMiddleware, predictionCtrl.getMyPredictionByRace);
// router.delete("/:id",teamsCtrl.deleteTeam)
// router.patch('/:id', authMiddleware, upload.single('img'),teamsCtrl.updateTeam   )


export default router;
 