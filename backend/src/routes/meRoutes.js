import { Router } from "express";
import { summary, saveSnapshot } from "../controllers/meController.js";

export const meRoutes = Router();
meRoutes.get("/summary", summary);
meRoutes.put("/snapshot", saveSnapshot);
