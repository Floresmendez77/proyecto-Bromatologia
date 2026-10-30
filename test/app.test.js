/**
 * @license MIT
 * Copyright (c) 2026 Honduras Bromatology Analyzer Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ImageCache } from '../src/services/imageCache.js';
import { detectImageMimeType } from '../src/middleware/validateUpload.js';
import {
  FoodAnalysisSchema,
  RoutineInputSchema,
  RoutineOutputSchema,
  SupplementAdvisorInputSchema,
  SupplementAdvisorOutputSchema,
  SCHEMA_VERSION
} from '../src/genkit/schemas.js';
import { server } from '../src/server.js';

describe('Bromatology Analyzer Suite', () => {
  after(() => new Promise((resolve) => {
    if (server && server.listening) {
      server.close(resolve);
    } else {
      resolve();
    }
  }));

  describe('ImageCache Service', () => {
    test('generateKey creates deterministic SHA-256 hash', () => {
      const buffer = Buffer.from('test-image-bytes');
      const key1 = ImageCache.generateKey(buffer, 'gemini-3.8-flash', SCHEMA_VERSION);
      const key2 = ImageCache.generateKey(buffer, 'gemini-3.8-flash', SCHEMA_VERSION);
      const keyDiffModel = ImageCache.generateKey(buffer, 'gemini-2.0-flash', SCHEMA_VERSION);

      assert.equal(typeof key1, 'string');
      assert.equal(key1.length, 64);
      assert.equal(key1, key2);
      assert.notEqual(key1, keyDiffModel);
    });

    test('stores and retrieves cached items with TTL', async () => {
      const cache = new ImageCache({ maxItems: 10, ttlMs: 50 });
      cache.set('item1', { food: 'Baleada' });

      assert.equal(cache.has('item1'), true);
      assert.deepEqual(cache.get('item1'), { food: 'Baleada' });

      // Wait for expiration
      await new Promise(r => setTimeout(r, 60));
      assert.equal(cache.has('item1'), false);
      assert.equal(cache.get('item1'), null);
    });

    test('LRU evicts least recently accessed items when full', () => {
      const cache = new ImageCache({ maxItems: 3, ttlMs: 10000 });
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Access 'a' to make 'b' the oldest
      cache.get('a');

      // Insert 'd', which should evict 'b'
      cache.set('d', 4);

      assert.equal(cache.has('a'), true);
      assert.equal(cache.has('b'), false, 'Key b should have been evicted by LRU');
      assert.equal(cache.has('c'), true);
      assert.equal(cache.has('d'), true);
    });

    test('deduplicates concurrent in-flight requests', async () => {
      const cache = new ImageCache({ maxItems: 5, ttlMs: 10000 });
      let computeCount = 0;

      const expensiveCompute = async () => {
        computeCount++;
        await new Promise(r => setTimeout(r, 30));
        return { result: 'Computed Food' };
      };

      // Launch 3 simultaneous requests for the same key
      const [res1, res2, res3] = await Promise.all([
        cache.getOrCompute('dupKey', expensiveCompute),
        cache.getOrCompute('dupKey', expensiveCompute),
        cache.getOrCompute('dupKey', expensiveCompute)
      ]);

      assert.equal(computeCount, 1, 'Compute function must only run once for identical in-flight requests');
      assert.deepEqual(res1.data, { result: 'Computed Food' });
      assert.deepEqual(res2.data, { result: 'Computed Food' });
      assert.deepEqual(res3.data, { result: 'Computed Food' });
    });
  });

  describe('Magic Bytes Validation', () => {
    test('identifies JPEG magic bytes', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      assert.equal(detectImageMimeType(jpegBuffer), 'image/jpeg');
    });

    test('identifies PNG magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      assert.equal(detectImageMimeType(pngBuffer), 'image/png');
    });

    test('identifies WebP magic bytes', () => {
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x20, 0x00, 0x00, 0x00, // Size
        0x57, 0x45, 0x42, 0x50  // WEBP
      ]);
      assert.equal(detectImageMimeType(webpBuffer), 'image/webp');
    });

    test('rejects non-image or corrupted buffers', () => {
      const fakeBuffer = Buffer.from('<html><body>Hello</body></html>');
      assert.equal(detectImageMimeType(fakeBuffer), null);

      const shortBuffer = Buffer.from([0xff, 0xd8]);
      assert.equal(detectImageMimeType(shortBuffer), null);
    });
  });

  describe('Zod Schema Validation', () => {
    test('validates complete Honduran food analysis payload', () => {
      const mockAnalysis = {
        isFood: true,
        foodName: 'Baleada con frijoles y cuajada',
        scientificName: 'Phaseolus vulgaris / Triticum aestivum',
        confidence: 0.95,
        chemicalComposition: {
          water: { value: 50.2, unit: '%' },
          ash: { value: 2.1, unit: '%' },
          fiber: { value: 4.5, unit: '%' },
          compounds: [
            { name: 'Polifenoles', value: 12.0, unit: 'mg/100g' }
          ]
        },
        macronutrients: {
          kcal: 250,
          protein: 8.0,
          carbs: 35.0,
          sugars: 1.5,
          fat: 9.0,
          satFat: 3.5,
          fiber: 4.5
        },
        itemCount: '1 baleada grande',
        portionDescription: '1 unidad (180g)',
        totalPortionEstimate: {
          kcal: 250,
          protein: 8.0,
          carbs: 35.0,
          fat: 9.0,
          fiber: 4.5
        },
        items: [
          {
            name: 'Baleada con frijoles',
            quantity: '1 unidad',
            kcal: 250,
            protein: 8.0,
            carbs: 35.0,
            fat: 9.0
          }
        ],
        healthierPrep: 'Tortilla de maíz nixtamalizado baja en grasa.',
        whatToEatNext: 'Pechuga a la plancha con ensalada para la cena.',
        micronutrients: [
          { name: 'Hierro', amount: 2.5, unit: 'mg', dvPercent: 14 }
        ],
        bromatologicalNotes: [
          'Conservar refrigerado a <= 4°C en Tegucigalpa para evitar acidificación rápida de los frijoles.'
        ],
        disclaimer: 'Estimación bromatológica de prueba.'
      };

      const parsed = FoodAnalysisSchema.parse(mockAnalysis);
      assert.equal(parsed.isFood, true);
      assert.equal(parsed.foodName, 'Baleada con frijoles y cuajada');
      assert.equal(parsed.confidence, 0.95);
    });

    test('validates not-food payload correctly', () => {
      const mockNotFood = {
        isFood: false,
        foodName: null,
        scientificName: null,
        itemCount: null,
        portionDescription: null,
        confidence: 0.99,
        chemicalComposition: {
          water: { value: null, unit: '%' },
          ash: { value: null, unit: '%' },
          fiber: { value: null, unit: '%' },
          compounds: []
        },
        macronutrients: {
          kcal: null,
          protein: null,
          carbs: null,
          sugars: null,
          fat: null,
          satFat: null,
          fiber: null
        },
        totalPortionEstimate: {
          kcal: null,
          protein: null,
          carbs: null,
          fat: null,
          fiber: null
        },
        items: [],
        healthierPrep: null,
        whatToEatNext: null,
        micronutrients: [],
        bromatologicalNotes: ['No se detectó alimento en la imagen.'],
        disclaimer: 'Aviso legal.'
      };

      const parsed = FoodAnalysisSchema.parse(mockNotFood);
      assert.equal(parsed.isFood, false);
      assert.equal(parsed.foodName, null);
    });

    test('validates FitMate RoutineInputSchema and RoutineOutputSchema', () => {
      const validRoutineInput = {
        goal: 'cut',
        days: 4,
        experience: 'intermedio',
        injuries: 'Ninguna',
        equipment: ['Mancuernas', 'Barra Olímpica', 'Poleas']
      };
      const parsedInput = RoutineInputSchema.parse(validRoutineInput);
      assert.equal(parsedInput.goal, 'cut');
      assert.equal(parsedInput.days, 4);

      const validRoutineOutput = {
        splitName: 'Push / Pull / Legs',
        overview: 'Rutina balanceada enfocada en fuerza e hipertrofia.',
        schedule: [
          {
            dayName: 'Día 1: Empuje',
            focus: 'Pectoral y deltoides',
            exercises: [
              {
                name: 'Press de Banca',
                machine: 'Banco Plano y Barra',
                startingWeight: '20 kg por lado',
                sets: 4,
                reps: '8-10',
                restSec: 90,
                overloadRule: 'Subir 2.5 kg al completar 4x10.',
                formCue: 'Retracción escapular firme.'
              }
            ]
          }
        ]
      };
      const parsedOutput = RoutineOutputSchema.parse(validRoutineOutput);
      assert.equal(parsedOutput.splitName, 'Push / Pull / Legs');
      assert.equal(parsedOutput.schedule.length, 1);
    });

    test('validates FitMate SupplementAdvisorInputSchema and SupplementAdvisorOutputSchema', () => {
      const validSuppInput = {
        goal: 'bulk',
        experience: 'avanzado',
        currentProteinGrams: 110,
        targetProteinGrams: 160,
        caloriesDeficitOrSurplus: 'déficit',
        dietaryRestrictions: 'Ninguna'
      };
      const parsedInput = SupplementAdvisorInputSchema.parse(validSuppInput);
      assert.equal(parsedInput.goal, 'bulk');
      assert.equal(parsedInput.targetProteinGrams, 160);

      const validSuppOutput = {
        summaryVerdict: 'Déficit proteico detectado de 50g respecto a la meta hipertrófica.',
        supplements: [
          {
            name: 'Proteína Whey Isolada',
            status: 'Recomendado',
            dose: '30g (1 scoop)',
            timing: 'Post-entrenamiento o entre comidas',
            rationale: 'Ayuda a cerrar la brecha proteica de 50g sin elevar calorías excesivas.'
          }
        ],
        safetyDisclaimer: 'Consulte con un médico o nutricionista clínico colegiado en Honduras.'
      };
      const parsedOutput = SupplementAdvisorOutputSchema.parse(validSuppOutput);
      assert.equal(parsedOutput.supplements.length, 1);
      assert.equal(parsedOutput.supplements[0].status, 'Recomendado');
    });
  });

  describe('HTTP Server Endpoints', () => {
    test('GET /healthz returns status 200 and json payload', async () => {
      const res = await fetch('http://127.0.0.1:8080/healthz');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'ok');
      assert.equal(data.service, 'fitmate-ai');
      assert.equal(typeof data.uptime, 'number');
    });

    test('POST /api/analyze without image returns 400 Bad Request', async () => {
      const res = await fetch('http://127.0.0.1:8080/api/analyze', {
        method: 'POST'
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.code, 400);
      assert.equal(data.error, 'Bad Request');
    });

    test('POST /api/routine with invalid payload returns 400 Bad Request', async () => {
      const res = await fetch('http://127.0.0.1:8080/api/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: true })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.code, 400);
    });

    test('POST /api/supplements with invalid payload returns 400 Bad Request', async () => {
      const res = await fetch('http://127.0.0.1:8080/api/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.code, 400);
    });
  });

});
