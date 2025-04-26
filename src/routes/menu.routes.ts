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
import rateLimiterMiddleware from "../middleware/rateLimitMiddleware";
import { authorizePermissions } from "../middleware/authorizeMiddleware";

const router = express.Router();

router.use(verifyJWT, authorizePermissions()); // Protect all routes with JWT authentication

router.get("/", getMenus); // GET /api/v1/menus
router.get("/:id", getMenu); // GET /api/v1/menus/:id
router.post("/", createMenu); // POST /api/v1/menus
router.put(
  "/reorder",
  rateLimiterMiddleware({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: "Too many request. Please wait before trying again.",
    keyGenerator: (req: any) => req.user?.userId,
  }),
  reorderMenus
); // PUT /api/v1/menus/reorder
router.put("/:id", updateMenu); // PUT /api/v1/menus/:id
router.delete("/:id", deleteMenu); // DELETE /api/v1/menus/:id

export default router;
