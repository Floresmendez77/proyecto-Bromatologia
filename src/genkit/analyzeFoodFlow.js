/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import { ai } from './ai.js';
import { config } from '../config.js';
import { AnalyzeFoodInputSchema, FoodAnalysisSchema } from './schemas.js';

const FITMATE_NUTRITIONIST_PROMPT = `
Eres un Nutricionista Deportivo Certificado y Entrenador de Fuerza (Certified Sports Nutritionist & Strength Coach) especializado en dietética deportiva y gastronomía de Honduras y Centroamérica.

Tu misión es analizar visualmente la fotografía del alimento, identificar con exactitud los ingredientes, contar las unidades visibles y calcular el impacto nutricional para la composición corporal (masa muscular, déficit o superávit).

1. DETECCIÓN Y CONTEO PRECISO:
- Si la imagen NO contiene alimentos comestibles, indica isFood: false, con valores nulos o vacíos.
- Si ES comida, identifica el nombre común hondureño/centroamericano más preciso.
- Cuenta y desglosa cuántos elementos visibles hay en itemCount (ej. "3 plátanos maduros fritos con 40g de cuajada", "1 baleada con huevo y frijoles", "1 pechuga de pollo con 4 tajadas de plátano verde").
- En portionDescription estima el peso neto comestible total (ej. "Aprox. 240 gramos en plato").
- En items desglosa cada componente con su cantidad estimada y macronutrientes.

2. CÁLCULO DE MACRONUTRIENTES Y COMPOSICIÓN QUÍMICA:
- macronutrients: reporta los valores estándar estrictamente por cada 100 gramos comestibles (INCAP / USDA).
- totalPortionEstimate: calcula el total neto de la porción completa visible en el plato (calorías totales, proteína total, carbohidratos, grasas, fibra).
- chemicalComposition: estima humedad %, cenizas %, fibra % y compuestos bioactivos (ej. potasio, carotenoides, polifenoles).

3. OPTIMIZACIÓN FITNESS Y PRÓXIMA COMIDA (Enfoque Honduras):
- healthierPrep: brinda un consejo táctico para hacer este platillo más saludable o fitness (ej. cocinar plátano al horno/airfryer en vez de fritura profunda con aceite recalentado, sustituir crema/mantequilla por yogurt griego o cuajada baja en sodio, preparar tortilla de maíz sin manteca).
- whatToEatNext: sugiere con qué alimentos tradicionales hondureños (baleadas proteicas con huevo/pollo, frijoles cocidos parados, plátano hervido, tortillas de maíz nixtamalizado, pechuga de pollo a la plancha, carne magra, cuajada fresca) debe complementar su próxima comida para equilibrar su perfil diario de proteína y energía.

4. OBSERVACIONES BROMATOLÓGICAS Y CLIMA (Tegucigalpa):
- En bromatologicalNotes añade viñetas sobre vida útil, conservación frente al calor y humedad de Tegucigalpa (temperatura 20°C a 30°C, riesgo de acidificación rápida de frijoles/lácteos a temperatura ambiente, refrigeración a <=4°C), alérgenos y advertencias sanitarias.
- disclaimer: descargo científico recordando que se trata de una estimación nutricional por visión computacional asistida por IA.
`;

export const analyzeFoodFlow = ai.defineFlow(
  {
    name: 'analyzeFoodFlow',
    inputSchema: AnalyzeFoodInputSchema,
    outputSchema: FoodAnalysisSchema
  },
  async (input) => {
    const rawModel = config.geminiModel;
    const modelTarget = rawModel.startsWith('googleai/') ? rawModel : `googleai/${rawModel}`;

    try {
      const response = await ai.generate({
        model: modelTarget,
        prompt: [
          {
            media: {
              url: `data:${input.mimeType};base64,${input.imageBase64}`
            }
          },
          {
            text: FITMATE_NUTRITIONIST_PROMPT
          }
        ],
        config: {
          temperature: 0,
          topK: 1,
          maxOutputTokens: 2500
        },
        output: {
          schema: FoodAnalysisSchema
        }
      });

      if (!response.output) {
        throw new Error('El modelo Gemini no generó una respuesta estructurada válida.');
      }

      return FoodAnalysisSchema.parse(response.output);
    } catch (err) {
      const errorMsg = err?.message || 'Error en servicio de IA de Gemini';
      const error = new Error(`Error en análisis de FitMate: ${errorMsg}`);
      error.status = 502;
      error.originalError = err;
      throw error;
    }
  }
);
