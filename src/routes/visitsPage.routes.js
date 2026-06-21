import { Router } from "express";
import * as visitsPageCtrl from  "../controllers/visitsPage.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/",visitsPageCtrl.createVisit);
router.get("/:page",authMiddleware, visitsPageCtrl.getVisitsByPage);


export default router;
 