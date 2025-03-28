import express, { Router } from "express";
import { authorizePermissions } from "../middleware/authorizeMiddleware";
import { validateData } from "../middleware/validationMiddleware";
import {
  bulkDeletePermissions,
  createPermission,
  createPermissionWithRoles,
  deletePermission,
  editPermission,
  editPermissionWithRoles,
  getPermission,
  getPermissions,
} from "../controllers/permission.controller";
import { PermissionSchema } from "../schemas/permission.schema";
import { verifyJWT } from "../middleware/authMiddleware";

const router: Router = express.Router();

router.use(verifyJWT, authorizePermissions());

router.get("/listing", getPermissions);
router.get("/one/:id", getPermission);
router.post("/create", validateData(PermissionSchema), createPermission);
router.post(
  "/create-with-roles",
  validateData(PermissionSchema),
  createPermissionWithRoles
);
router.put("/:id/edit", validateData(PermissionSchema), editPermission);
router.put(
  "/:id/edit-with-roles",
  validateData(PermissionSchema),
  editPermissionWithRoles
);
router.delete("/:id/delete", deletePermission);
router.delete("/bulk-delete", bulkDeletePermissions);

export default router;
