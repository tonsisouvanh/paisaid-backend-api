import express from "express";
import authRoutes from "./auth.route";
import masterRoutes from "./master.route";
import uploadRoutes from "./upload.route";
import roleRoutes from "./role.route";
import userRoutes from "./user.route";
import permissionRoutes from "./permission.route";
import resourceRoutes from "./resource.route";
import menuRoutes from "./menu.routes";
import postRoutes from "./post.route";
import categoryRoutes from "./category.route";
import tagRoutes from "./tag.route";
import photoRoutes from "./photo.route";
const router = express.Router();

router.use("/upload", uploadRoutes);
router.use("/auth", authRoutes);
router.use("/master", masterRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/resources", resourceRoutes);
router.use("/menus", menuRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/categories", categoryRoutes);
router.use("/tags", tagRoutes);
router.use("/photos", photoRoutes);

export default router;
