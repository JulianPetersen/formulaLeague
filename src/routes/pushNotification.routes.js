import { Router } from "express";
import * as pushController from  "../controllers/pushcontroler.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/",authMiddleware, roleMiddleware(["admin", "moderator"]), pushController.sendCustomPush);


    
export default router;
