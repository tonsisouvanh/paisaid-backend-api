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
import { authenticate } from "../middleware/authMiddleware";
import { authorizePermissions } from "middleware/authorizeMiddleware";

const router = express.Router();

// Public routes
router.get("/posts/:slug/reviews", getPostReviews);
router.get("/reviews/:id", getReview);

// Authenticated user routes
router.post("/posts/:slug/reviews", authenticate, createReview);
router.put("/reviews/:id", authenticate, updateReview);
router.delete("/reviews/:id", authenticate, deleteReview);

// Admin-only routes
router.patch(
  "/reviews/:id/approve",
  authenticate,
  authorizePermissions("approve:post"),
  approveReview
);
router.patch(
  "/reviews/:id/reject",
  authenticate,
  authorizePermissions("reject:post"),
  rejectReview
);

export default router;
