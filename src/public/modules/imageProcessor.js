/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

export async function processAndResizeImage(file, maxDimension = 1024, quality = 0.82) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('El archivo proporcionado no es una imagen válida.');
  }

  const imageBitmap = await createImageBitmap(file).catch(async () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo decodificar la imagen: ' + err.message));
      };
      img.src = url;
    });
  });

  const width = imageBitmap.width;
  const height = imageBitmap.height;

  let targetWidth = width;
  let targetHeight = height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      targetWidth = maxDimension;
      targetHeight = Math.round((height * maxDimension) / width);
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.round((width * maxDimension) / height);
    }
  }

  // Use OffscreenCanvas if available for high-throughput background processing
  if (typeof OffscreenCanvas !== 'undefined') {
    const offscreen = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = offscreen.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

      if (typeof imageBitmap.close === 'function') imageBitmap.close();

      const blob = await offscreen.convertToBlob({ type: 'image/jpeg', quality });
      return {
        blob,
        width: targetWidth,
        height: targetHeight,
        originalSize: file.size,
        compressedSize: blob.size
      };
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto de canvas 2D.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  if (typeof imageBitmap.close === 'function') {
    imageBitmap.close();
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Falló la conversión de canvas a Blob JPEG.'));
        }
      },
      'image/jpeg',
      quality
    );
  });

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    originalSize: file.size,
    compressedSize: blob.size
  };
}

export async function createThumbnail(file, maxDimension = 120) {
  try {
    const { blob } = await processAndResizeImage(file, maxDimension, 0.6);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

let activeStream = null;

export async function startWebcam(videoElement) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Tu navegador no soporta captura de cámara directa.');
  }

  if (activeStream) {
    stopWebcam(videoElement);
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920, min: 640 },
      height: { ideal: 1080, min: 480 }
    },
    audio: false
  });

  activeStream = stream;
  videoElement.srcObject = stream;
  await videoElement.play();
  return stream;
}

export function captureWebcamFrame(videoElement) {
  if (!videoElement || !videoElement.videoWidth) {
    throw new Error('La cámara aún no ha inicializado su transmisión de video.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `captura-comida-${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve(file);
      } else {
        reject(new Error('No se pudo congelar el cuadro de la cámara.'));
      }
    }, 'image/jpeg', 0.9);
  });
}

export function stopWebcam(videoElement) {
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
    activeStream = null;
  }
  if (videoElement) {
    videoElement.srcObject = null;
  }
}
