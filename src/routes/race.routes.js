import { Router } from "express";
import * as raceCtrl from  "../controllers/race.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/",authMiddleware, roleMiddleware(["admin", "moderator"]),raceCtrl.createRace);
router.get("/", raceCtrl.getAllRaces);
router.get("/:id", raceCtrl.getRaceById);
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "moderator"]), raceCtrl.deleteRace)
router.patch('/:id', authMiddleware,roleMiddleware(["admin", "moderator"]),raceCtrl.updateRace   )
router.post("/:id/close", authMiddleware, roleMiddleware(["admin", "moderator"]), raceCtrl.closeRace);

export default router;
