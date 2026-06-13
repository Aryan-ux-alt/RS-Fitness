import { Router } from "express";
import { askFitnessCoach, askFitnessCoachStream } from "../controllers/aiController.js";

export const aiRoutes = Router();

// Test endpoint - should return immediately
aiRoutes.post("/test", (_req, res) => {
  console.log("[AI TEST] Request received");
  return res.json({ ok: true, message: "AI test endpoint working!" });
});

// Health check
aiRoutes.get("/health", (_req, res) => res.json({ ok: true, message: "AI service ready" }));

// Regular AI chat endpoint
aiRoutes.post("/ask", askFitnessCoach);

// Streaming endpoint for real-time responses
aiRoutes.post("/ask-stream", askFitnessCoachStream);
