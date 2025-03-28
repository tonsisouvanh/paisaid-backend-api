import express from "express";
import {
  clearTokens,
  getMe,
  refreshToken,
  setRefreshToken,
  signIn,
  signOut,
} from "../controllers/auth.controller";
import { verifyJWT, verifyRefreshToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/sign-in", signIn);
router.post("/sign-out", verifyJWT, signOut);
router.post("/clear-tokens", clearTokens); // New endpoint
router.post("/refresh-token", verifyRefreshToken, refreshToken);
router.post("/set-refresh-token", setRefreshToken);
router.get("/me", verifyJWT, getMe);

export default router;
