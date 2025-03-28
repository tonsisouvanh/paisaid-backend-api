import {
  createUser,
  deleteUser,
  editUser,
  getUser,
  getUsers,
  resetUserPassword,
} from "../controllers/user.controller";
import express, { Router } from "express";
import { authorizePermissions } from "../middleware/authorizeMiddleware";
import { UserSchema } from "../schemas/user.schema";
import { validateData } from "../middleware/validationMiddleware";
import { verifyJWT } from "../middleware/authMiddleware";

const router: Router = express.Router();
router.use(verifyJWT, authorizePermissions());
router.get("/listing", getUsers);
router.post("/create", validateData(UserSchema), createUser);
router.get("/one/:id", getUser);
router.put("/:id/edit", validateData(UserSchema), editUser);
router.delete("/:id/delete", deleteUser);
router.post("/:id/reset-password", resetUserPassword);

export default router;
