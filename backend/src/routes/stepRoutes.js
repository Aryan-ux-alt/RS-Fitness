import { Router } from "express";
import { upsertSteps } from "../controllers/stepController.js";

export const stepRoutes = Router();
stepRoutes.put("/", upsertSteps);
