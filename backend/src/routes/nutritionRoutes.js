import { Router } from "express";
import { addFoodEntry, listFoodEntries, saveCalorieProfile } from "../controllers/nutritionController.js";

export const nutritionRoutes = Router();
nutritionRoutes.post("/profile", saveCalorieProfile);
nutritionRoutes.get("/food", listFoodEntries);
nutritionRoutes.post("/food", addFoodEntry);
