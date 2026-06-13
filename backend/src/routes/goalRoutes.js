import { Router } from "express";
import { updateGoal } from "../controllers/goalController.js";

export const goalRoutes = Router();
goalRoutes.put("/", updateGoal);
