import express from "express";
import {
  getPostReviews,
  createReview,
  getReview,
  updateReview,
  deleteReview,
  approveReview,
  rejectReview,
} from "../controllers/review.controller";
import { verifyJWT } from "../middleware/authMiddleware";
import { authorizePermissions } from "../middleware/authorizeMiddleware";

const router = express.Router();

// Public routes
router.get("/posts/:slug/reviews", getPostReviews);
router.get("/reviews/:id", getReview);

// Authenticated user routes
router.post("/posts/:slug/reviews", verifyJWT, createReview);
router.put("/reviews/:id", verifyJWT, updateReview);
router.delete("/reviews/:id", verifyJWT, deleteReview);

// Admin-only routes
router.patch(
  "/reviews/:id/approve",
  verifyJWT,
  authorizePermissions("approve:post"),
  approveReview
);
router.patch(
  "/reviews/:id/reject",
  verifyJWT,
  authorizePermissions("reject:post"),
  rejectReview
);

export default router;
