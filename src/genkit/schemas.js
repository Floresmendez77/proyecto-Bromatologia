/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import { z } from 'zod';

export const SCHEMA_VERSION = '2.0.0';

export const FoodAnalysisSchema = z.object({
  isFood: z.boolean().describe('Indica si la imagen contiene un alimento comestible'),
  foodName: z.string().nullable().describe('Nombre culinario común hondureño/centroamericano o null'),
  scientificName: z.string().nullable().describe('Nombre taxonómico botánico o zoológico del ingrediente primordial o null'),
  itemCount: z.string().nullable().describe('Conteo o desglose de piezas detectadas (ej. 3 plátanos, 1 baleada)'),
  portionDescription: z.string().nullable().describe('Descripción estimada de la porción total en gramos o piezas'),
  confidence: z.number().min(0).max(1).describe('Nivel de certeza de la identificación (0.00 a 1.00)'),
  chemicalComposition: z.object({
    water: z.object({
      value: z.number().nullable().describe('Valor numérico de humedad estimado o null'),
      unit: z.string().describe('Unidad de medida (ej. % o g/100g)')
    }).describe('Humedad o contenido de agua por 100g'),
    ash: z.object({
      value: z.number().nullable().describe('Valor numérico de cenizas estimado o null'),
      unit: z.string().describe('Unidad de medida (ej. % o g/100g)')
    }).describe('Cenizas totales / minerales por 100g'),
    fiber: z.object({
      value: z.number().nullable().describe('Valor numérico de fibra estimado o null'),
      unit: z.string().describe('Unidad de medida (ej. % o g/100g)')
    }).describe('Fibra dietética total por 100g'),
    compounds: z.array(
      z.object({
        name: z.string().describe('Nombre del metabolito, fitoquímico o compuesto bioactivo'),
        value: z.number().nullable().describe('Concentración estimada o null'),
        unit: z.string().describe('Unidad de concentración (ej. mg/100g, µg/g)')
      })
    ).describe('Compuestos fitoquímicos o bioactivos relevantes')
  }).describe('Composición química proximal por cada 100g'),
  macronutrients: z.object({
    kcal: z.number().nullable().describe('Energía calórica en kilocalorías por 100g'),
    protein: z.number().nullable().describe('Proteína total en gramos por 100g'),
    carbs: z.number().nullable().describe('Carbohidratos totales en gramos por 100g'),
    sugars: z.number().nullable().describe('Azúcares simples en gramos por 100g'),
    fat: z.number().nullable().describe('Grasas totales / lípidos en gramos por 100g'),
    satFat: z.number().nullable().describe('Grasa saturada en gramos por 100g'),
    fiber: z.number().nullable().describe('Fibra dietética en gramos por 100g')
  }).describe('Perfil de macronutrientes por cada 100g'),
  totalPortionEstimate: z.object({
    kcal: z.number().nullable().describe('Energía estimada para la porción total visualizada en la imagen'),
    protein: z.number().nullable().describe('Proteína total estimada para la porción visualizada (g)'),
    carbs: z.number().nullable().describe('Carbohidratos totales estimados para la porción visualizada (g)'),
    fat: z.number().nullable().describe('Grasas totales estimadas para la porción visualizada (g)'),
    fiber: z.number().nullable().describe('Fibra estimada para la porción visualizada (g)')
  }).describe('Estimación de macronutrientes para el total de la porción en el plato'),
  items: z.array(
    z.object({
      name: z.string().describe('Nombre del alimento individual detectado'),
      quantity: z.string().describe('Cantidad o conteo estimado (ej. 2 unidades, 150g)'),
      kcal: z.number().describe('Calorías estimadas'),
      protein: z.number().describe('Proteína en gramos'),
      carbs: z.number().describe('Carbohidratos en gramos'),
      fat: z.number().describe('Grasa en gramos')
    })
  ).describe('Desglose de elementos o ingredientes individuales identificados'),
  healthierPrep: z.string().nullable().describe('Sugerencia de preparación más saludable o alternativa fitness'),
  whatToEatNext: z.string().nullable().describe('Sugerencia de próxima comida para balancear macros diarios con alimentos hondureños'),
  micronutrients: z.array(
    z.object({
      name: z.string().describe('Nombre de la vitamina o mineral'),
      amount: z.number().nullable().describe('Cantidad estimada por 100g o null'),
      unit: z.string().describe('Unidad (mg, µg, UI)'),
      dvPercent: z.number().nullable().describe('Porcentaje del Valor Diario recomendado (% DV) para 2000 kcal')
    })
  ).describe('Vitaminas y minerales destacados'),
  bromatologicalNotes: z.array(z.string()).describe('Observaciones bromatológicas sobre vida útil, alérgenos, clima de Tegucigalpa y riesgos'),
  disclaimer: z.string().describe('Aviso legal y científico bromatológico')
});

export const AnalyzeFoodInputSchema = z.object({
  imageBase64: z.string().min(1).describe('Imagen codificada en base64'),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/).describe('Tipo MIME validado')
});

export const RoutineInputSchema = z.object({
  goal: z.enum(['cut', 'bulk', 'maintain']).describe('Objetivo del usuario'),
  days: z.number().min(2).max(7).describe('Días de entrenamiento por semana'),
  experience: z.enum(['principiante', 'intermedio', 'avanzado']).describe('Nivel de experiencia'),
  injuries: z.string().describe('Lesiones o restricciones físicas'),
  equipment: z.array(z.string()).describe('Equipamiento disponible en el gimnasio seleccionado')
});

export const RoutineOutputSchema = z.object({
  splitName: z.string().describe('Nombre de la división de entrenamiento (ej. Push/Pull/Legs)'),
  overview: z.string().describe('Resumen metodológico y justificación del programa'),
  schedule: z.array(
    z.object({
      dayName: z.string().describe('Nombre del día (ej. Día 1: Empuje - Pectoral y Deltoides)'),
      focus: z.string().describe('Grupos musculares foco'),
      exercises: z.array(
        z.object({
          name: z.string().describe('Nombre del ejercicio'),
          machine: z.string().describe('Máquina o implemento a utilizar'),
          startingWeight: z.string().describe('Recomendación de carga inicial sugerida'),
          sets: z.number().describe('Número de series de trabajo'),
          reps: z.string().describe('Rango de repeticiones objetivo (ej. 8-10 reps)'),
          restSec: z.number().describe('Segundos de descanso entre series'),
          overloadRule: z.string().describe('Regla de sobrecarga progresiva concreta'),
          formCue: z.string().describe('Clave técnica o biomecánica de ejecución')
        })
      ).describe('Lista de ejercicios del día')
    })
  ).describe('Cronograma semanal de entrenamiento')
});

export const SupplementAdvisorInputSchema = z.object({
  goal: z.string().describe('Objetivo fitness'),
  experience: z.string().describe('Nivel de entrenamiento'),
  currentProteinGrams: z.number().describe('Proteína consumida hoy (g)'),
  targetProteinGrams: z.number().describe('Meta de proteína diaria (g)'),
  caloriesDeficitOrSurplus: z.string().describe('Estado calórico (déficit, superávit, mantenimiento)'),
  dietaryRestrictions: z.string().describe('Restricciones dietéticas o alergias')
});

export const SupplementAdvisorOutputSchema = z.object({
  summaryVerdict: z.string().describe('Diagnóstico nutricional respecto a brechas de la dieta'),
  supplements: z.array(
    z.object({
      name: z.string().describe('Nombre del suplemento (ej. Creatina monohidrato, Proteína de suero)'),
      status: z.enum(['Recomendado', 'Opcional', 'No necesario']).describe('Nivel de necesidad'),
      dose: z.string().describe('Dosis exacta sugerida (o N/A si no es necesario)'),
      timing: z.string().describe('Momento de consumo óptimo'),
      rationale: z.string().describe('Fundamento científico y relación con la meta del usuario')
    })
  ).describe('Evaluación de suplementos analizados'),
  safetyDisclaimer: z.string().describe('Descargo médico y de seguridad suplementaria')
});
