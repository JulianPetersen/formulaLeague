import { Router } from "express";
import * as trackCtrl from  "../controllers/track.controller.js";
import upload from '../middlewares/upload.middleware'
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/",authMiddleware, roleMiddleware(["admin", "moderator"]), upload.single('img'), trackCtrl.crateTrack);
router.get("/", authMiddleware, trackCtrl.getAllTracks);
router.get("/:id",authMiddleware ,trackCtrl.getTracktById);  
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "moderator"]),trackCtrl.deleteTrack)
router.patch('/:id', authMiddleware, upload.single('img'),trackCtrl.updateTrack)
export default router;  