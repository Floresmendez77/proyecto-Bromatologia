/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import { ai } from './ai.js';
import { config } from '../config.js';
import { SupplementAdvisorInputSchema, SupplementAdvisorOutputSchema } from './schemas.js';

const SUPPLEMENT_PROMPT = `
Eres un Nutricionista Deportivo Certificado con enfoque en suplementación basada en evidencia científica (ISSN, AIS).
Evalúa la ingesta actual, la meta física y las brechas nutricionales del usuario para dictaminar con rigor científico qué suplementos son verdaderamente útiles, cuáles son opcionales y cuáles NO SON NECESARIOS.

CRITERIOS:
1. Si el usuario ya cubre su meta de proteína con comida real, indica que la proteína en polvo es "No necesario" o meramente "Opcional" por conveniencia. Si tiene un déficit notable de proteína, recomiéndala.
2. Evalúa Creatina Monohidrato (dosis de 3-5g diarios continuos sin fase de carga obligatoria) como "Recomendado" para fuerza/hipertrofia a menos que haya contraindicación.
3. Evalúa otros suplementos (Cafeína, Multivitamínico, Omega-3, Electrolitos) según el objetivo (ej. déficit calórico pronunciado o volumen).
4. Explica la dosis y el momento óptimo (timing) para los recomendados.
5. Incluye un descargo médico y de seguridad suplementaria enfatizando que los suplementos no sustituyen una alimentación balanceada ni supervisión médica previa.
`;

export const supplementFlow = ai.defineFlow(
  {
    name: 'supplementFlow',
    inputSchema: SupplementAdvisorInputSchema,
    outputSchema: SupplementAdvisorOutputSchema
  },
  async (input) => {
    const rawModel = config.geminiModel;
    const modelTarget = rawModel.startsWith('googleai/') ? rawModel : `googleai/${rawModel}`;

    const promptText = `
${SUPPLEMENT_PROMPT}

ESTADO NUTRICIONAL ACTUAL:
- Objetivo: ${input.goal}
- Nivel de experiencia: ${input.experience}
- Proteína consumida hoy: ${input.currentProteinGrams} g
- Meta de proteína diaria: ${input.targetProteinGrams} g
- Brecha de proteína: ${Math.round(input.targetProteinGrams - input.currentProteinGrams)} g
- Estado calórico: ${input.caloriesDeficitOrSurplus}
- Restricciones dietéticas: ${input.dietaryRestrictions || 'Ninguna'}
`;

    try {
      const response = await ai.generate({
        model: modelTarget,
        prompt: promptText,
        config: {
          temperature: 0.1,
          topK: 1,
          maxOutputTokens: 2500
        },
        output: {
          schema: SupplementAdvisorOutputSchema
        }
      });

      if (!response.output) {
        throw new Error('Gemini no generó un dictamen de suplementación válido.');
      }

      return SupplementAdvisorOutputSchema.parse(response.output);
    } catch (err) {
      const errorMsg = err?.message || 'Error en asesor de suplementos';
      const error = new Error(`Error en evaluación de suplementos: ${errorMsg}`);
      error.status = 502;
      error.originalError = err;
      throw error;
    }
  }
);
