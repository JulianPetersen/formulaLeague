import { Router } from "express";
import * as userCtrl from  "../controllers/users.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = Router();


router.get("/", authMiddleware,userCtrl.getInfoUser);
router.get("/getcredits", authMiddleware,userCtrl.getCreditsByUser);
router.get("/getTopUser", authMiddleware,userCtrl.getTopUsers);
router.get("/getAllUSers",authMiddleware,roleMiddleware(["admin", "moderator"]),userCtrl.getAllUsers);
router.patch("/addUserName", authMiddleware, userCtrl.setUsername)


export default router;
