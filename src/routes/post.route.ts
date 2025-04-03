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
import { getPostPhotos, reorderPhotos } from "../controllers/photo.controller";
import { verifyJWT, verifyJWTOptional } from "../middleware/authMiddleware";
import rateLimiterMiddleware from "../middleware/rateLimitMiddleware";

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

// // Public routes
// router.get("/", verifyJWTOptional, getPosts);
// router.get("/:id/post-detail", verifyJWTOptional, getPost);
// router.get("/:slug/nearby", getNearbyPosts);
// router.get("/trending", getTrendingPosts);

// // Admin-only routes
// router.post(
//   "/create",
//   upload.array("images", 5),
//   verifyJWT,
//   authorizePermissions("create:post"),
//   validateData(PostSchema),
//   createPost
// );

// router.put(
//   "/:id/update",
//   verifyJWT,
//   authorizePermissions("update:post"),
//   upload.array("images", 5),
//   updatePost
// ); // Add this

// router.delete(
//   "/bulk-delete",
//   verifyJWT,
//   authorizePermissions("delete:post"),
//   bulkDeletePosts
// );

// router.delete("/:id", verifyJWT, authorizePermissions(""), deletePost);

// router.patch("/:id/increment-view", incrementViewCount); // Could be public or protected

// router.patch("/:id/publish", verifyJWT, authorizePermissions(""), publishPost);

// router.patch("/:id/archive", verifyJWT, authorizePermissions(""), archivePost);

// router.post(
//   "/bulk-create",
//   verifyJWT,
//   authorizePermissions("bulk_delete:post"),
//   bulkCreatePosts
// );

// Public Routes
router.get(
  "/",
  verifyJWTOptional,
  rateLimiterMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per IP
    message: "Too many requests to fetch posts. Please try again later.",
    keyGenerator: (req: Request) => req.ip, // IP-based
  }),
  getPosts
);

router.get(
  "/:id/post-detail",
  verifyJWTOptional,
  rateLimiterMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP
    message: "Too many requests for post details. Please try again later.",
  }),
  getPost
);

router.get(
  "/:slug/nearby",
  rateLimiterMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP
    message: "Too many requests for nearby posts. Please try again later.",
  }),
  getNearbyPosts
);

router.get(
  "/trending",
  rateLimiterMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per IP
    message: "Too many requests for trending posts. Please try again later.",
  }),
  getTrendingPosts
);

// Admin-only Routes
router.post(
  "/create",
  upload.array("images", 5),
  verifyJWT,
  authorizePermissions("create:post"),
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 posts per user
    message:
      "Too many post creation attempts. Please wait before trying again.",
    keyGenerator: (req: any) => req.user?.userId, // User ID-based
  }),
  validateData(PostSchema),
  createPost
);

router.put(
  "/:id/update",
  verifyJWT,
  authorizePermissions("update:post"),
  upload.array("images", 5),
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 updates per user
    message: "Too many post update attempts. Please wait before trying again.",
    keyGenerator: (req: any) => req.user?.userId,
  }),
  updatePost
);

router.delete(
  "/bulk-delete",
  verifyJWT,
  authorizePermissions("delete:post"),
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 bulk deletes per user
    message: "Too many bulk delete attempts. Please wait before trying again.",
    keyGenerator: (req: any) => req.user?.userId,
  }),
  bulkDeletePosts
);

router.delete(
  "/:id",
  verifyJWT,
  authorizePermissions(""),
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 deletes per user
    message: "Too many delete attempts. Please wait before trying again.",
    keyGenerator: (req: any) => req.user?.userId,
  }),
  deletePost
);

router.patch(
  "/:id/increment-view",
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 increments per IP
    message: "Too many view increment requests. Please try again later.",
  }),
  incrementViewCount
);

router.patch(
  "/:id/publish",
  verifyJWT,
  authorizePermissions(""),
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 publish actions per user
    message: "Too many publish attempts. Please wait before trying again.",
    keyGenerator: (req: any) => req.user?.userId,
  }),
  publishPost
);

router.patch(
  "/:id/archive",
  verifyJWT,
  authorizePermissions(""),
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 archive actions per user
    message: "Too many archive attempts. Please wait before trying again.",
    keyGenerator: (req: any) => req.user?.userId,
  }),
  archivePost
);

router.post(
  "/bulk-create",
  verifyJWT,
  authorizePermissions("bulk_delete:post"), // Should this be 'bulk_create:post'?
  rateLimiterMiddleware({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 bulk creates per user
    message: "Too many bulk create attempts. Please wait before trying again.",
    keyGenerator: (req: any) => req.user?.userId,
  }),
  bulkCreatePosts
);

router.get(
  "/:slug/photos",
  rateLimiterMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP
    message: "Too many photo requests. Please try again later.",
  }),
  getPostPhotos
);

router.patch(
  "/:slug/photos/reorder",
  verifyJWT,
  authorizePermissions("reorder:photos"), // New permission for admins
  // validateData(PhotoReorderSchema),
  reorderPhotos
);

export default router;
