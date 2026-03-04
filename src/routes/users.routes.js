import { Router } from "express";
import * as userCtrl from  "../controllers/users.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";


const router = Router();


router.get("/", authMiddleware,userCtrl.getInfoUser);
router.get("/getTopUser", authMiddleware,userCtrl.getTopUsers);



export default router;
