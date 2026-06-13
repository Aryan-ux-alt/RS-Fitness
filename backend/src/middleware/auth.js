import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing access token" });
  try {
    req.user = jwt.verify(token, env.jwtAccessSecret);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}
