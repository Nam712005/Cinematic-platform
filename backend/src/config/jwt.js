import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from './env.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

export function signRefreshToken(payload, { rememberMe = false } = {}) {
  const expiresIn = rememberMe ? env.jwt.refreshRememberExpiresIn : env.jwt.refreshExpiresIn;
  return jwt.sign(
    {
      ...payload,
      jti: crypto.randomUUID(),
    },
    env.jwt.refreshSecret,
    { expiresIn }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

export function generateRandomToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

export function getTokenExpirationDate(jwtToken) {
  const decoded = jwt.decode(jwtToken);
  if (decoded && typeof decoded.exp === 'number') {
    return new Date(decoded.exp * 1000);
  }
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
