import express from "express";
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
} from "../controllers/tag.controller";
import { authorizePermissions } from "../middleware/authorizeMiddleware";
import { verifyJWT } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.get("/", getTags);
router.get("/:id", getTag);

// Admin-only routes
router.post("/create", verifyJWT, authorizePermissions(), createTag);
router.put("/:id/update", verifyJWT, authorizePermissions(), updateTag);
router.delete("/:id/delete", verifyJWT, authorizePermissions(), deleteTag);

export default router;
