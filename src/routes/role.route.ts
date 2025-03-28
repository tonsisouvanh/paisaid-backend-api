import {
  createRole,
  createRoleWithPermission,
  deleteRole,
  editRole,
  editRoleWithPermission,
  getRole,
  getRoles,
} from "../controllers/role.controller";
import express, { Router } from "express";
import { authorizePermissions } from "../middleware/authorizeMiddleware";
import { validateData } from "../middleware/validationMiddleware";
import { RoleSchema } from "../schemas/role.schema";
import { verifyJWT } from "../middleware/authMiddleware";

const router: Router = express.Router();

router.use(verifyJWT, authorizePermissions());

router.get("/role-listing", getRoles);
router.get("/one/:id", getRole);
router.post("/create", validateData(RoleSchema), createRole);
router.post(
  "/create-with-permission",
  validateData(RoleSchema),
  createRoleWithPermission
);
router.put("/:id/edit", validateData(RoleSchema), editRole);
router.put(
  "/:id/edit-with-permission",
  validateData(RoleSchema),
  editRoleWithPermission
);
router.delete("/:id/delete", deleteRole);

export default router;
