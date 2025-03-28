import express, { Request } from "express";
import {
  archivePost,
  bulkCreatePosts,
  bulkDeletePosts,
  createPost,
  deletePost,
  getNearbyPosts,
  getPost,
  getPosts,
  getTrendingPosts,
  incrementViewCount,
  publishPost,
  updatePost,
} from "../controllers/post.controller";
import { authorizePermissions } from "../middleware/authorizeMiddleware";
import { validateData } from "../middleware/validationMiddleware";
import { PostSchema } from "../schemas/post.schema";

import multer, { FileFilterCallback } from "multer";
import { getPostPhotos } from "../controllers/photo.controller";
import { verifyJWT, verifyJWTOptional } from "../middleware/authMiddleware";

const router = express.Router();

export const fileFilter = (
  request: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Public routes
router.get("/", verifyJWTOptional, getPosts);
router.get("/:id/post-detail", verifyJWTOptional, getPost);
router.get("/:slug/nearby", getNearbyPosts);
router.get("/trending", getTrendingPosts);

// Admin-only routes
router.post(
  "/create",
  upload.array("images", 5),
  verifyJWT,
  authorizePermissions("create:post"),
  validateData(PostSchema),
  createPost
);

router.put(
  "/:id/update",
  verifyJWT,
  authorizePermissions("update:post"),
  upload.array("images", 5),
  updatePost
); // Add this

router.delete(
  "/bulk-delete",
  verifyJWT,
  authorizePermissions("delete:post"),
  bulkDeletePosts
);

router.delete("/:id", verifyJWT, authorizePermissions(""), deletePost);

router.patch("/:id/increment-view", incrementViewCount); // Could be public or protected

router.patch("/:id/publish", verifyJWT, authorizePermissions(""), publishPost);

router.patch("/:id/archive", verifyJWT, authorizePermissions(""), archivePost);

router.post(
  "/bulk-create",
  verifyJWT,
  authorizePermissions("bulk_delete:post"),
  bulkCreatePosts
);

router.get("/:slug/photos", getPostPhotos);

export default router;
