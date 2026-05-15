import { Router } from "express";
import { HealthCheckController } from "../controllers/HealthCheckController.js";

const router = Router();

router.get("/health", HealthCheckController.health);

export default router;