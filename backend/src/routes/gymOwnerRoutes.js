import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loginGymOwner, signupGymOwner, logoutGymOwner, refreshGymOwnerToken, getGymMembers, sendMemberReminder } from "../controllers/gymOwnerController.js";

export const gymOwnerRoutes = Router();
gymOwnerRoutes.post("/signup", signupGymOwner);
gymOwnerRoutes.post("/login", loginGymOwner);
gymOwnerRoutes.post("/logout", logoutGymOwner);
gymOwnerRoutes.post("/refresh", refreshGymOwnerToken);
gymOwnerRoutes.get("/members", requireAuth, getGymMembers);
gymOwnerRoutes.post("/send-reminder", requireAuth, sendMemberReminder);
