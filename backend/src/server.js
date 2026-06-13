import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { routes } from "./routes/index.js";

const app = express();
const allowedOrigins = new Set(env.corsOrigin.split(",").map(origin => origin.trim()).filter(Boolean));
const isLocalDevOrigin = origin => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || (env.nodeEnv === "development" && isLocalDevOrigin(origin))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

app.use("/api", routes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === "ZodError") return res.status(400).json({ message: "Invalid request", issues: err.issues });
  res.status(500).json({ message: "Internal server error" });
});

app.listen(env.port, () => {
  console.log(`RS Fitness API running on http://localhost:${env.port}`);
});
