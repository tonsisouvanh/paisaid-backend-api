import { authenticate } from "../middleware/authMiddleware";

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

const router: Router = express.Router();

router.use(authenticate, authorizePermissions());

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
