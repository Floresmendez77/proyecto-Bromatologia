/**
 * @license MIT
 * Copyright (c) 2026 Honduras Bromatology Analyzer Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || '86400000', 10),
  cacheMaxItems: parseInt(process.env.CACHE_MAX_ITEMS || '500', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  schemaVersion: '1.0.0'
};
