/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import { ai } from './ai.js';
import { config } from '../config.js';
import { RoutineInputSchema, RoutineOutputSchema } from './schemas.js';
import { FALLBACK_ROUTINE_PUSH_PULL_LEGS } from '../public/modules/routineData.js';

const ROUTINE_PROMPT = `
Eres un Entrenador de Fuerza y Especialista en Hipertrofia de Nivel Élite (Certified Strength & Conditioning Specialist).
Diseña una rutina semanal estructurada, altamente técnica y personalizada, adaptada estrictamente al equipamiento disponible, objetivo, nivel de experiencia y lesiones del usuario.

REGLAS CRÍTICAS:
1. Utiliza ÚNICAMENTE ejercicios realizables con el equipamiento especificado. Si no tienen una máquina específica, utiliza variantes seguras con mancuernas, barras o peso corporal.
2. Respeta estrictamente las lesiones mencionadas (ej. si hay lesión lumbar, sustituye peso muerto convencional y sentadilla trasera pesada por variantes con apoyo de pecho o sentadilla búlgara).
3. Para CADA ejercicio define:
   - name: nombre técnico estándar del ejercicio.
   - machine: equipo o implemento exacto a usar.
   - startingWeight: sugerencia de peso inicial orientativo según nivel (ej. "Mancuernas de 12-14 kg", "Barra olímpica + 10 kg por lado").
   - sets: número de series de trabajo efectivas (sin contar calentamiento).
   - reps: rango de repeticiones objetivo (ej. "8-10 reps", "10-12 reps", "6-8 reps").
   - restSec: descanso en segundos (ej. 90 o 120 para compuestos, 60 para aislamiento).
   - overloadRule: regla práctica de sobrecarga progresiva (ej. "Cuando completes 3x10 con técnica sólida, aumenta 2.5 kg en la primera serie").
   - formCue: consejo biomecánico clave de ejecución (ej. "Retracción escapular, trayectoria en diagonal, pausa de 1 segundo en el estiramiento").
4. Genera un esquema coherente con el número de días solicitados (ej. Push/Pull/Legs para 3-6 días, Torso/Pierna para 4 días, Full Body para 3 días).
`;

export const routineFlow = ai.defineFlow(
  {
    name: 'routineFlow',
    inputSchema: RoutineInputSchema,
    outputSchema: RoutineOutputSchema
  },
  async (input) => {
    const rawModel = config.geminiModel;
    const modelTarget = rawModel.startsWith('googleai/') ? rawModel : `googleai/${rawModel}`;

    const promptText = `
${ROUTINE_PROMPT}

DATOS DEL ATLETA:
- Objetivo: ${input.goal} (definición/volumen/mantenimiento)
- Días por semana: ${input.days}
- Experiencia: ${input.experience}
- Lesiones o limitaciones: ${input.injuries || 'Ninguna'}
- Equipamiento disponible: ${input.equipment.join(', ')}
`;

    try {
      const response = await ai.generate({
        model: modelTarget,
        prompt: promptText,
        config: {
          temperature: 0.2,
          topK: 1,
          maxOutputTokens: 3000
        },
        output: {
          schema: RoutineOutputSchema
        }
      });

      const raw = response?.output;
      if (!raw || !Array.isArray(raw.schedule)) {
        return FALLBACK_ROUTINE_PUSH_PULL_LEGS;
      }

      // Sanitize exercises to ensure no required properties are missing
      raw.schedule.forEach((day, dIdx) => {
        if (!day.dayName) day.dayName = `Día ${dIdx + 1}: Sesión de Entrenamiento`;
        if (!day.focus) day.focus = 'Grupos musculares principales';
        if (Array.isArray(day.exercises)) {
          day.exercises = day.exercises.map((ex) => ({
            name: ex?.name || 'Ejercicio Guiado',
            machine: ex?.machine || 'Mancuernas / Peso Libre',
            startingWeight: ex?.startingWeight || 'Carga moderada',
            sets: Number(ex?.sets) || 3,
            reps: ex?.reps || '8-12 reps',
            restSec: Number(ex?.restSec) || 90,
            overloadRule: ex?.overloadRule || 'Incrementar peso progresivamente al completar las repeticiones.',
            formCue: ex?.formCue || 'Mantener control excéntrico y rango completo de movimiento.'
          }));
        } else {
          day.exercises = [];
        }
      });

      return RoutineOutputSchema.parse(raw);
    } catch (err) {
      process.stderr.write(`[routineFlow] Fallback used due to: ${err?.message || err}\n`);
      return FALLBACK_ROUTINE_PUSH_PULL_LEGS;
    }
  }
);
