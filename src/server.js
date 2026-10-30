/**
 * @license MIT
 * Copyright (c) 2026 Honduras Bromatology Analyzer Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from './config.js';
import {
  helmetMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  jsonLoggerMiddleware
} from './middleware/security.js';
import { validateUpload } from './middleware/validateUpload.js';
import { imageCache, ImageCache } from './services/imageCache.js';
import { analyzeFoodFlow } from './genkit/analyzeFoodFlow.js';
import { routineFlow } from './genkit/routineFlow.js';
import { supplementFlow } from './genkit/supplementFlow.js';
import { FALLBACK_ROUTINE_PUSH_PULL_LEGS } from './public/modules/routineData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust reverse proxy for Cloud Run
app.set('trust proxy', 1);

// Global middleware
app.use(jsonLoggerMiddleware);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));

// Serve static frontend assets
const publicPath = join(__dirname, 'public');
app.use(express.static(publicPath, {
  maxAge: config.nodeEnv === 'production' ? '1h' : 0,
  etag: true
}));

// Health check endpoint for Cloud Run
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'fitmate-ai'
  });
});

// Food analysis endpoint
app.post('/api/analyze', rateLimitMiddleware, validateUpload, async (req, res, next) => {
  try {
    const { buffer, mimeType, base64 } = req.validatedFile;

    const cacheKey = ImageCache.generateKey(buffer, config.geminiModel, config.schemaVersion);

    const { data, cacheHit } = await imageCache.getOrCompute(cacheKey, async () => {
      return await analyzeFoodFlow({
        imageBase64: base64,
        mimeType
      });
    });

    res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
    return res.status(200).json({
      success: true,
      cache: cacheHit ? 'HIT' : 'MISS',
      data
    });
  } catch (err) {
    next(err);
  }
});

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Routine endpoints
app.get('/api/routine', rateLimitMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    data: FALLBACK_ROUTINE_PUSH_PULL_LEGS
  });
});

app.post('/api/routine', rateLimitMiddleware, async (req, res, next) => {
  try {
    const { goal, days, experience, injuries, equipment } = req.body;
    if (!goal || !days || !experience || !Array.isArray(equipment)) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 400,
        message: 'Faltan parámetros requeridos para generar la rutina (goal, days, experience, equipment).'
      });
    }

    const data = await routineFlow({
      goal,
      days: Number(days),
      experience,
      injuries: injuries || 'Ninguna',
      equipment
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
});

// Supplements Advisor endpoint
app.post('/api/supplements', rateLimitMiddleware, async (req, res, next) => {
  try {
    const { goal, experience, currentProteinGrams, targetProteinGrams, caloriesDeficitOrSurplus, dietaryRestrictions } = req.body;
    if (!goal || currentProteinGrams === undefined || targetProteinGrams === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 400,
        message: 'Faltan parámetros requeridos para el asesor de suplementos.'
      });
    }

    const data = await supplementFlow({
      goal,
      experience: experience || 'intermedio',
      currentProteinGrams: Number(currentProteinGrams),
      targetProteinGrams: Number(targetProteinGrams),
      caloriesDeficitOrSurplus: caloriesDeficitOrSurplus || 'mantenimiento',
      dietaryRestrictions: dietaryRestrictions || 'Ninguna'
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
});

// Centralized error handler with typed status codes
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  const responseBody = {
    error: status === 502 ? 'Bad Gateway' : (status === 400 ? 'Bad Request' : 'Internal Server Error'),
    code: status,
    message
  };

  process.stderr.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    status,
    message,
    path: req.originalUrl,
    errorDetails: err.stack || err.toString()
  }) + '\n');

  res.status(status).json(responseBody);
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    code: 404,
    message: 'Recurso API no encontrado.'
  });
});

// Start HTTP server
const server = app.listen(config.port, '0.0.0.0', () => {
  process.stdout.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `Servidor Bromatología Honduras iniciado en http://0.0.0.0:${config.port}`,
    nodeEnv: config.nodeEnv,
    model: config.geminiModel
  }) + '\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    process.stderr.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: `El puerto ${config.port} ya se encuentra ocupado por otra instancia del servidor.`
    }) + '\n');
  } else {
    throw err;
  }
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  process.stdout.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `Señal ${signal} recibida. Cerrando servidor HTTP...`
  }) + '\n');

  server.close(() => {
    process.stdout.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Conexiones cerradas exitosamente. Finalizando proceso.'
    }) + '\n');
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    process.stderr.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: 'Cierre forzado por tiempo límite excedido (10s).'
    }) + '\n');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { server };
export default app;
