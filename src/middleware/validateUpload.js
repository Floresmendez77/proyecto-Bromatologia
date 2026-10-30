/**
 * @license MIT
 * Copyright (c) 2026 Honduras Bromatology Analyzer Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
}).single('image');

export function detectImageMimeType(buffer) {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: 'RIFF' .... 'WEBP'
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export function validateUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Payload Too Large',
          code: 413,
          message: 'El archivo excede el límite máximo permitido de 5 MB.'
        });
      }
      return res.status(400).json({
        error: 'Bad Request',
        code: 400,
        message: `Error al procesar la carga de archivo: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 400,
        message: err.message || 'Error en la solicitud de carga.'
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 400,
        message: 'No se envió ninguna imagen. Debe adjuntar un archivo en el campo "image".'
      });
    }

    const detectedMime = detectImageMimeType(req.file.buffer);
    if (!detectedMime) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        code: 415,
        message: 'Formato de imagen inválido o no soportado. Se requieren bytes mágicos válidos para JPEG, PNG o WebP.'
      });
    }

    req.validatedFile = {
      buffer: req.file.buffer,
      mimeType: detectedMime,
      size: req.file.size || req.file.buffer.length,
      base64: req.file.buffer.toString('base64')
    };

    next();
  });
}
