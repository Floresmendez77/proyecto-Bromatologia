/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

export function calculateBMR(weightKg, heightCm, age, sex) {
  // Mifflin-St Jeor Equation
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return sex === 'female' ? Math.round(base - 161) : Math.round(base + 5);
}

export function getActivityMultiplier(activityLevel) {
  switch (activityLevel) {
    case 'sedentary': return 1.2;
    case 'light': return 1.375;
    case 'moderate': return 1.55;
    case 'very_active': return 1.725;
    case 'athlete': return 1.9;
    default: return 1.55;
  }
}

export function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * getActivityMultiplier(activityLevel));
}

export function calculateTargets(profile) {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.sex);
  const tdee = calculateTDEE(bmr, profile.activity);

  let targetCalories = tdee;
  if (profile.goal === 'cut') {
    targetCalories = Math.max(tdee - 450, 1300); // Sustainable 450 kcal deficit
  } else if (profile.goal === 'bulk') {
    targetCalories = tdee + 350; // Clean 350 kcal surplus
  }

  // Protein targets: 2.0g per kg of bodyweight
  const proteinGrams = Math.round(profile.weight * (profile.goal === 'cut' ? 2.2 : 2.0));
  const proteinKcal = proteinGrams * 4;

  // Fat targets: 0.9g per kg of bodyweight
  const fatGrams = Math.round(profile.weight * 0.9);
  const fatKcal = fatGrams * 9;

  // Remaining calories to carbohydrates
  const remainingKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
  const carbsGrams = Math.round(remainingKcal / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    targetProtein: proteinGrams,
    targetCarbs: carbsGrams,
    targetFat: fatGrams,
    targetFiber: Math.round((targetCalories / 1000) * 14) // 14g per 1000 kcal
  };
}

export function estimateBodyType(weightKg, heightCm, goal) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  let type = 'Mesomorfo';
  let title = 'Predominancia Mesomorfa';
  let explanation = 'Estructura atlética equilibrada con buena capacidad para responder al estímulo de hipertrofia y regular la grasa corporal eficientemente.';
  let trainingTip = 'Respondes excelente a sobrecarga progresiva en rangos de 6-12 repeticiones y descansos de 90 a 120 segundos.';

  if (bmi < 21.0) {
    type = 'Ectomorfo';
    title = 'Predominancia Ectomorfa';
    explanation = 'Estructura ósea ligera, metabolismo basal naturalmente acelerado y menor propensión al almacenamiento de grasa y glucógeno.';
    trainingTip = 'Prioriza superávit calórico controlado, limita el cardio extenuante y enfócate en ejercicios multiarticulares pesados.';
  } else if (bmi > 26.5) {
    type = 'Endomorfo';
    title = 'Predominancia Endomorfa';
    explanation = 'Estructura ósea amplia, mayor densidad y tendencia biológica a retener energía y masa corporal con facilidad.';
    trainingTip = 'Mantén alta ingesta de proteína saciante, distribuye los carbohidratos alrededor del entrenamiento y combina fuerza con cardio moderado.';
  }

  return {
    type,
    title,
    bmi: parseFloat(bmi.toFixed(1)),
    explanation,
    trainingTip
  };
}

export function computeDailyVerdict(consumed, targets) {
  const calDiff = targets.targetCalories - consumed.kcal;
  const proteinDiff = targets.targetProtein - consumed.protein;

  let status = 'on-track'; // 'on-track' | 'under' | 'over'
  let badgeText = 'EN META';
  let color = 'cyan';
  let tip = '¡Excelente adherencia! Continúa con tu hidratación y descanso programado.';

  if (calDiff > 350) {
    status = 'under';
    badgeText = 'DÉFICIT ELEVADO';
    color = 'violet';
    if (proteinDiff > 25) {
      tip = `Te faltan ${Math.round(proteinDiff)}g de proteína para proteger tu masa muscular. Una merienda con pollo, huevos o cuajada fresca te pondrá en meta.`;
    } else {
      tip = 'Aún tienes margen calórico hoy. Puedes incorporar carbohidratos complejos como plátano cocido o frijoles para reponer glucógeno.';
    }
  } else if (calDiff < -250) {
    status = 'over';
    badgeText = 'SUPERÁVIT ALTO';
    color = 'amber';
    tip = 'Has superado el límite calórico diario. Prioriza caminata ligera post-entrenamiento y vegetales con fibra en tu próxima comida.';
  } else if (proteinDiff > 20) {
    status = 'under';
    badgeText = 'PROTEÍNA BAJA';
    color = 'violet';
    tip = `Tus calorías van bien, pero te faltan ${Math.round(proteinDiff)}g de proteína. Prioriza una fuente magra en tu próxima ingesta.`;
  }

  return {
    status,
    badgeText,
    color,
    tip,
    remainingKcal: calDiff,
    remainingProtein: proteinDiff,
    remainingCarbs: targets.targetCarbs - consumed.carbs,
    remainingFat: targets.targetFat - consumed.fat
  };
}
