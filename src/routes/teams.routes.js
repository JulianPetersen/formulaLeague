import { Router } from "express";
import * as teamsCtrl from  "../controllers/teams.controller";
import upload from '../middlewares/upload.middleware'
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/",authMiddleware, roleMiddleware(["admin", "moderator"]), upload.single('img'),teamsCtrl.createTeam);
router.get("/", teamsCtrl.getAllTeams);
router.get("/:id", teamsCtrl.getAllTeams);
router.delete("/:id",teamsCtrl.deleteTeam)
router.patch('/:id',authMiddleware, roleMiddleware(["admin", "moderator"]), authMiddleware, upload.single('img'),teamsCtrl.updateTeam   )

    
export default router;
