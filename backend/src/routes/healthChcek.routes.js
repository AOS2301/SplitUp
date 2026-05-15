import { Router } from "express";
import { HealthCheckController } from "../controllers/HealthChecklController.js";

const router = Router();

router.get("/health", HealthCheckController.health);

export default router;