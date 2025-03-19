import express from "express";
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
} from "../controllers/tag.controller";
import { authenticate } from "../middleware/authMiddleware";
import { authorizePermissions } from "../middleware/authorizeMiddleware";

const router = express.Router();

// Public routes
router.get("/", getTags);
router.get("/:id", getTag);

// Admin-only routes
router.post("/create", authenticate, authorizePermissions(), createTag);
router.put("/:id/update", authenticate, authorizePermissions(), updateTag);
router.delete("/:id/delete", authenticate, authorizePermissions(), deleteTag);

export default router;
