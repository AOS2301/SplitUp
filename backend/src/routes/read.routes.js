import { Router } from "express";
import { ReadController } from "../controllers/ReadController.js";

import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });


const router = Router();

router.post("/read/receipt", upload.single("arquivo"), ReadController.readReceipt);

export default router;