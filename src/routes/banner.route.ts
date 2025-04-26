import express, { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { verifyJWT } from "../middleware/authMiddleware";
import { authorizePermissions } from "../middleware/authorizeMiddleware";
import {
  deleteBannerSlide,
  getBanner,
  getBannerSlides,
  reorderBannerSlides,
  upsertBannerSlide,
} from "../controllers/banner.controller";

const router = express.Router();

export const fileFilter = (
  request: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Public route to fetch banners
router.get("/", getBannerSlides);
router.get("/:id", getBanner);

// Admin routes
router.post(
  "/upsert",
  verifyJWT,
  authorizePermissions("manage:banners"),
  upload.single("image"),
  upsertBannerSlide
);

router.delete(
  "/:id",
  verifyJWT,
  authorizePermissions("manage:banners"),
  deleteBannerSlide
);

router.patch(
  "/reorder",
  verifyJWT,
  authorizePermissions("manage:banners"),
  reorderBannerSlides
);

export default router;
