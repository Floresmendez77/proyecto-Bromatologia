/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

export class ApiError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function analyzeFoodImage(imageBlob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'food-upload.jpg');

  let response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
  } catch {
    throw new ApiError(
      'Error de conexión de red. Verifique su acceso a internet o disponibilidad del servicio.',
      0,
      'NETWORK_ERROR'
    );
  }

  const cacheHeader = response.headers.get('X-Cache') || 'MISS';

  let responseData;
  try {
    responseData = await response.json();
  } catch {
    throw new ApiError(
      `El servidor respondió con código HTTP ${response.status} pero el formato no fue JSON válido.`,
      response.status,
      'INVALID_JSON'
    );
  }

  if (!response.ok) {
    const errorMsg = responseData.message || responseData.error || `Error HTTP ${response.status}`;
    throw new ApiError(errorMsg, response.status, 'SERVER_ERROR');
  }

  return {
    analysis: responseData.data,
    cacheHit: cacheHeader === 'HIT'
  };
}

export async function generateWorkoutRoutine(params, options = {}) {
  let response;
  try {
    response = await fetch('/api/routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: options.signal
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError('La solicitud ha tardado más de 30 segundos (tiempo de espera agotado).', 408, 'TIMEOUT');
    }
    throw new ApiError('Error de red al consultar el Entrenador de IA.', 0, 'NETWORK_ERROR');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Respuesta no válida del servidor.', response?.status || 500, 'INVALID_JSON');
  }

  if (!response.ok) {
    throw new ApiError(data.message || 'Error al generar rutina con IA', response.status, 'ROUTINE_ERROR');
  }

  return data.data;
}

export async function getSupplementsAdvice(params) {
  let response;
  try {
    response = await fetch('/api/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  } catch {
    throw new ApiError('Error de red al consultar el Asesor de Suplementos.', 0, 'NETWORK_ERROR');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Respuesta no válida del servidor.', response.status, 'INVALID_JSON');
  }

  if (!response.ok) {
    throw new ApiError(data.message || 'Error en asesor de suplementos', response.status, 'SUPPLEMENT_ERROR');
  }

  return data.data;
}
