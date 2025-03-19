// import { deletePhoto } from "../controllers/photo.controller";
// import express from "express";
// import { authenticate } from "../middleware/authMiddleware";
// import { authorizePermissions } from "../middleware/authorizeMiddleware";

// const router = express.Router();

// router.delete(
//   "/:id/delete",
//   authenticate,
//   authorizePermissions("delete:post_photo"),
//   deletePhoto
// );

// export default router;

import express from "express";
import multer from "multer";

import { authenticate } from "../middleware/authMiddleware";
import { authorizePermissions } from "../middleware/authorizeMiddleware";
import {
  deletePhoto,
  getPostPhotos,
  updatePhoto,
  uploadPhoto,
} from "../controllers/photo.controller";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Authenticated routes
router.post(
  "/posts/:slug/photos",
  authenticate,
  upload.single("image"),
  uploadPhoto
);

router.put("/photos/:id", authenticate, updatePhoto);

router.delete(
  "/:id/delete",
  authenticate,
  authorizePermissions("delete:post_photo"),
  deletePhoto
);

export default router;
