import { Router } from "express";
import * as prizeCtrl from  "../controllers/prize.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/",authMiddleware, roleMiddleware(["admin", "moderator"]),prizeCtrl.createNewPrize);
router.get("/",authMiddleware, prizeCtrl.getActivedPrize);
router.get("/allPrizes",authMiddleware, prizeCtrl.getAllPrizes);
router.patch('/:id', authMiddleware,roleMiddleware(["admin", "moderator"]),prizeCtrl.updatePrize)
router.patch('/changeStatusToActive/:id', authMiddleware,roleMiddleware(["admin", "moderator"]), prizeCtrl.changeStatusToActive)

export default router;
 