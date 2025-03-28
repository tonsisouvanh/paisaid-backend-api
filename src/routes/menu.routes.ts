import express from "express";

import {
  createMenu,
  deleteMenu,
  getMenu,
  getMenus,
  reorderMenus,
  updateMenu,
} from "../controllers/menu.controller";
import { verifyJWT } from "../middleware/authMiddleware";

const router = express.Router();

// Apply authentication middleware (assuming only admins can access these routes)
router.use(verifyJWT);

// Menu routes
router.get("/listing", getMenus); // GET /api/v1/menus/list
router.get("/one/:id", getMenu); // GET /api/v1/menus/:id
router.post("/create", createMenu); // POST /api/v1/menus/create
router.put("/:id/edit", updateMenu); // PUT /api/v1/menus/:id
router.delete("/:id/delete", deleteMenu); // DELETE /api/v1/menus/:id
router.put("/reorder", reorderMenus); // PUT /api/v1/menus/reorder

export default router;
