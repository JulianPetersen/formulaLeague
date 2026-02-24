import { Router } from "express";
import * as pilotCtrl from  "../controllers/pilot.controller.js";
import upload from '../middlewares/upload.middleware'
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/",authMiddleware, roleMiddleware(["admin", "moderator"]), upload.single('img'),pilotCtrl.createPilot);
router.get("/", authMiddleware,pilotCtrl.getAllPilots);
router.get("/:id",authMiddleware ,pilotCtrl.getPilotById);  
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "moderator"]),pilotCtrl.deletePilot)
router.patch('/:id', authMiddleware, upload.single('img'),pilotCtrl.updatePilot   )


export default router;  