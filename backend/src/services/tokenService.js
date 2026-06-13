import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../db/pool.js";

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl,
  });
}

export async function createRefreshToken(user, req) {
  const tokenId = crypto.randomUUID();
  const refreshToken = jwt.sign({ sub: user.id, jti: tokenId }, env.jwtRefreshSecret, {
    expiresIn: `${env.refreshTokenTtlDays}d`,
  });
  const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, now() + ($6 || ' days')::interval)`,
    [tokenId, user.id, hash, req.headers["user-agent"] || null, req.ip || null, env.refreshTokenTtlDays],
  );
  return refreshToken;
}

export async function revokeRefreshToken(refreshToken) {
  const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await query("UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1", [hash]);
}
