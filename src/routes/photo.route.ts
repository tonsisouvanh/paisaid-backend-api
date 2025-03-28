// import { deletePhoto } from "../controllers/photo.controller";
// import express from "express";
// import { verifyJWT } from "../middleware/authMiddleware";
// import { authorizePermissions } from "../middleware/authorizeMiddleware";

// const router = express.Router();

// router.delete(
//   "/:id/delete",
//   verifyJWT,
//   authorizePermissions("delete:post_photo"),
//   deletePhoto
// );

// export default router;

import express from "express";
import multer from "multer";

import {
  deletePhoto,
  updatePhoto,
  uploadPhoto,
} from "../controllers/photo.controller";
import { verifyJWT } from "../middleware/authMiddleware";
import { authorizePermissions } from "../middleware/authorizeMiddleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Authenticated routes
router.post(
  "/posts/:slug/photos",
  verifyJWT,
  upload.single("image"),
  uploadPhoto
);

router.put("/photos/:id", verifyJWT, updatePhoto);

router.delete(
  "/:id/delete",
  verifyJWT,
  authorizePermissions("delete:post_photo"),
  deletePhoto
);

export default router;
