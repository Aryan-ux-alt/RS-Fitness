import { Router } from "express";
import { createWorkout, listWorkouts } from "../controllers/workoutController.js";

export const workoutRoutes = Router();
workoutRoutes.get("/", listWorkouts);
workoutRoutes.post("/", createWorkout);
