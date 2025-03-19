import express from "express";
import {
  getMe,
  refreshToken,
  signIn,
  signOut,
} from "../controllers/auth.controller";
import { authenticate, verifyRefreshToken } from "../middleware/authMiddleware";
import { validateData } from "../middleware/validationMiddleware";
import { userSigninSchema } from "../schemas/auth.schema";

const router = express.Router();

router.post("/sign-in", validateData(userSigninSchema), signIn);
router.post("/sign-out", authenticate, signOut);
router.post("/refresh-token", verifyRefreshToken, refreshToken);
router.get("/me", authenticate, getMe);

export default router;
