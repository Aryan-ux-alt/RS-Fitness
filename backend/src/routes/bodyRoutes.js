import { Router } from "express";
import { addMetric, listMetrics } from "../controllers/bodyController.js";

export const bodyRoutes = Router();
bodyRoutes.get("/metrics", listMetrics);
bodyRoutes.post("/metrics", addMetric);
