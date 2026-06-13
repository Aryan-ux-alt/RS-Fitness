import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loginGymOwner, signupGymOwner, getGymMembers, logoutGymOwner, refreshGymOwnerToken, getGymRevenue, sendMemberReminder, getPaymentsByMonth } from "../controllers/gymOwnerController.js";

export const gymOwnerRoutes = Router();
gymOwnerRoutes.post("/signup", signupGymOwner);
gymOwnerRoutes.post("/login", loginGymOwner);
gymOwnerRoutes.post("/logout", logoutGymOwner);
gymOwnerRoutes.post("/refresh", refreshGymOwnerToken);
gymOwnerRoutes.get("/members", requireAuth, getGymMembers);
gymOwnerRoutes.get("/revenue", requireAuth, getGymRevenue);
gymOwnerRoutes.post("/send-reminder", requireAuth, sendMemberReminder);
gymOwnerRoutes.get("/payments", requireAuth, getPaymentsByMonth);
