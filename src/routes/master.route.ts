import { getDistricts } from "../controllers/district.controller";
import { getProvinces } from "../controllers/province.controller";
import express, { Router } from "express";

const router: Router = express.Router();

router.get("/provinces/list", getProvinces);
router.get("/districts/list", getDistricts);

export default router;
