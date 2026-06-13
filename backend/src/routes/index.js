import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { authRoutes } from "./authRoutes.js";
import { bodyRoutes } from "./bodyRoutes.js";
import { goalRoutes } from "./goalRoutes.js";
import { gymOwnerRoutes } from "./gymOwnerRoutes.js";
import { membershipRoutes } from "./membershipRoutes.js";
import { meRoutes } from "./meRoutes.js";
import { nutritionRoutes } from "./nutritionRoutes.js";
import { workoutRoutes } from "./workoutRoutes.js";
import { aiRoutes } from "./aiRoutes.js";

export const routes = Router();

routes.get("/health", (_req, res) => res.json({ ok: true }));
routes.get("/ai/health", (_req, res) => res.json({ ok: true, message: "AI service ready" }));
routes.use("/auth", authRoutes);
routes.use("/gym-owners", gymOwnerRoutes);
routes.use("/me", requireAuth, meRoutes);
routes.use("/workouts", requireAuth, workoutRoutes);
routes.use("/body", requireAuth, bodyRoutes);
routes.use("/nutrition", requireAuth, nutritionRoutes);
routes.use("/memberships", requireAuth, membershipRoutes);
routes.use("/goal", requireAuth, goalRoutes);
routes.use("/ai", requireAuth, aiRoutes);
