import { Router } from "express";
import * as versionAppCtrl from  "../controllers/versionApp.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/",authMiddleware, roleMiddleware(["admin", "moderator"]),versionAppCtrl.createNewVersion);
router.get("/get-latest-version",authMiddleware, versionAppCtrl.getLatestVersion);
router.get("/", versionAppCtrl.getAllVersions);

 
export default router;
    