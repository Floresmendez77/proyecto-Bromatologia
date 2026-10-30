/**
 * @license MIT
 * Copyright (c) 2026 Honduras Bromatology Analyzer Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.gstatic.com', 'https://apis.google.com', 'https://maps.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com', 'https://maps.gstatic.com', 'https://maps.googleapis.com'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseio.com', 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com', 'https://*.google.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      frameSrc: ["'self'", 'https://*.firebaseapp.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: config.nodeEnv === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: config.nodeEnv === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false
});

export const corsMiddleware = cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Cache']
});

export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      code: 429,
      message: 'Límite de solicitudes de análisis excedido. Por favor espere antes de enviar otra imagen.'
    });
  }
});

export function jsonLoggerMiddleware(req, res, next) {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number((endTime - startTime) / 1000000n);

    // Sanitize headers and NEVER log credentials or sensitive data
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: parseFloat(durationMs.toFixed(2)),
      contentLength: res.get('content-length') ? parseInt(res.get('content-length'), 10) : undefined,
      cache: res.get('X-Cache') || 'NONE',
      ip: req.ip || req.socket?.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    };

    // Print single-line clean structured JSON to stdout
    process.stdout.write(JSON.stringify(logEntry) + '\n');
  });

  next();
}
