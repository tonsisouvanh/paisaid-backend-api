import express, { Router } from "express";
import { authorizePermissions } from "../middleware/authorizeMiddleware";
import { validateData } from "../middleware/validationMiddleware";
import {
  resourceSchema,
  resourceUpdateSchema,
} from "../schemas/resource.schema";
import {
  bulkDeleteResources,
  createResource,
  deleteResource,
  editResource,
  getResource,
  getResources,
} from "../controllers/resource.controller";
import { verifyJWT } from "../middleware/authMiddleware";

const router: Router = express.Router();

router.use(verifyJWT);

router.get("/listing", authorizePermissions("view:resource"), getResources);
router.get("/one/:id", authorizePermissions("view:resource"), getResource);
router.post(
  "/create",
  authorizePermissions("create:resource"),
  validateData(resourceSchema),
  createResource
);
router.put(
  "/:id/edit",
  authorizePermissions("update:resource"),
  validateData(resourceUpdateSchema),
  editResource
);
router.delete(
  "/:id/delete",
  authorizePermissions("delete:resource"),
  deleteResource
);
router.delete(
  "/bulk-delete",
  authorizePermissions("delete:resource"),
  bulkDeleteResources
);

export default router;
