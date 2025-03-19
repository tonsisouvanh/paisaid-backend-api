import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../controllers/category.controller";
import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { authorizePermissions } from "../middleware/authorizeMiddleware";

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategory);

// Admin-only routes
router.post("/create", authenticate, authorizePermissions(""), createCategory);
router.put(
  "/:id/update",
  authenticate,
  authorizePermissions(""),
  updateCategory
);
router.delete(
  "/:id/delete",
  authenticate,
  authorizePermissions(""),
  deleteCategory
);

export default router;
