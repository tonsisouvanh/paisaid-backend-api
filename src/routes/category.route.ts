import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../controllers/category.controller";
import express from "express";
import { authorizePermissions } from "../middleware/authorizeMiddleware";
import { verifyJWT } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategory);

// Admin-only routes
router.post("/create", verifyJWT, authorizePermissions(), createCategory);
router.put("/:id/update", verifyJWT, authorizePermissions(), updateCategory);
router.delete("/:id/delete", verifyJWT, authorizePermissions(), deleteCategory);

export default router;
