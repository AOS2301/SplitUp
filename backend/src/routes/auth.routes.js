import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { authGuard } from "../guard/auth.guard.js";

const router = Router();

router.get("/me", authGuard, AuthController.me);

export default router;
