import { Router } from "express";
import { login, logout, signup, refresh, checkGymRegistered, getRegisteredGyms } from "../controllers/authController.js";

export const authRoutes = Router();
authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.post("/refresh", refresh);
authRoutes.get("/check-gym", checkGymRegistered);
authRoutes.get("/gyms", getRegisteredGyms);
