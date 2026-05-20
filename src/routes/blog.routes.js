import { Router } from "express";
import * as blogCtrl from "../controllers/blog.controller";


import upload from "../middlewares/upload.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();

router.get("/slug/:slug", blogCtrl.getBlogBySlug); 

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "moderator"]),
  blogCtrl.createNews
);

router.get("/",blogCtrl.getAllnews);


router.get("/:id", blogCtrl.getnewsById);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "moderator"]),
  blogCtrl.deleteNews
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "moderator"]),
  blogCtrl.updatenews
);

/* upload imagen para CKEditor */

router.post(
  "/upload",
  authMiddleware,
  roleMiddleware(["admin", "moderator"]),
  upload.single("file"),
  blogCtrl.uploadNewsImage
);


  
export default router; 