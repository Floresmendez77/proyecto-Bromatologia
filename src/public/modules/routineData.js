/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

export const DEFAULT_EQUIPMENT_LIST = [
  'Mancuernas (Dumbbells)',
  'Barra Olímpica y Discos',
  'Jaula de Sentadillas (Power Rack)',
  'Banco Plano y Reclinable',
  'Prensa de Piernas (Leg Press)',
  'Poleas Ajustables (Cable Crossover)',
  'Máquina Smith',
  'Máquina de Extensión de Cuádriceps',
  'Máquina de Curl Femoral Acostado',
  'Máquina de Jalón al Pecho (Lat Pulldown)',
  'Barra de Dominadas y Fondos (Pull-up / Dips)',
  'Máquina de Remo en Polea Baja',
  'Prensa Inclinada en Máquina',
  'Hip Thrust Machine / Barra',
  'Mancuernas Ligeras (1-10 kg)',
  'Bandas de Resistencia',
  'Kettlebells'
];

export const SEED_GYMS = [
  {
    id: 'gym-smartfit-cascadas',
    name: 'Smart Fit - Mall Las Cascadas',
    city: 'Tegucigalpa',
    address: 'Bulevar Fuerzas Armadas, Mall Las Cascadas',
    equipment: [
      'Mancuernas (Dumbbells)',
      'Barra Olímpica y Discos',
      'Banco Plano y Reclinable',
      'Prensa de Piernas (Leg Press)',
      'Poleas Ajustables (Cable Crossover)',
      'Máquina Smith',
      'Máquina de Extensión de Cuádriceps',
      'Máquina de Curl Femoral Acostado',
      'Máquina de Jalón al Pecho (Lat Pulldown)',
      'Máquina de Remo en Polea Baja'
    ]
  },
  {
    id: 'gym-maxfitness-morazan',
    name: 'Max Fitness - Plaza Morazán',
    city: 'Tegucigalpa',
    address: 'Bulevar Morazán, Centro Comercial Plaza Morazán',
    equipment: [
      'Mancuernas (Dumbbells)',
      'Barra Olímpica y Discos',
      'Jaula de Sentadillas (Power Rack)',
      'Banco Plano y Reclinable',
      'Prensa de Piernas (Leg Press)',
      'Poleas Ajustables (Cable Crossover)',
      'Máquina Smith',
      'Máquina de Extensión de Cuádriceps',
      'Máquina de Curl Femoral Acostado',
      'Máquina de Jalón al Pecho (Lat Pulldown)',
      'Barra de Dominadas y Fondos (Pull-up / Dips)',
      'Hip Thrust Machine / Barra'
    ]
  },
  {
    id: 'gym-planet-proceres',
    name: 'Planet Fitness - Los Próceres',
    city: 'Tegucigalpa',
    address: 'Bulevar Los Próceres, frente a Novacentro',
    equipment: [
      'Mancuernas (Dumbbells)',
      'Banco Plano y Reclinable',
      'Prensa de Piernas (Leg Press)',
      'Poleas Ajustables (Cable Crossover)',
      'Máquina Smith',
      'Máquina de Extensión de Cuádriceps',
      'Máquina de Curl Femoral Acostado',
      'Máquina de Jalón al Pecho (Lat Pulldown)',
      'Mancuernas Ligeras (1-10 kg)'
    ]
  },
  {
    id: 'gym-home-minimalist',
    name: 'Home Gym / Calistenia',
    city: 'Tegucigalpa / En Casa',
    address: 'Entrenamiento en Hogar',
    equipment: [
      'Mancuernas (Dumbbells)',
      'Barra de Dominadas y Fondos (Pull-up / Dips)',
      'Bandas de Resistencia'
    ]
  }
];

export const HONDURAN_FOOD_DATABASE = [
  { name: 'Baleada sencilla con frijoles y cuajada', portion: '1 unidad (140g)', kcal: 280, protein: 9, carbs: 42, fat: 8, fiber: 5 },
  { name: 'Baleada especial con huevo, frijoles y aguacate', portion: '1 unidad (220g)', kcal: 410, protein: 17, carbs: 46, fat: 18, fiber: 7 },
  { name: 'Plátano maduro asado con queso fresco', portion: '1 plátano mediano (180g)', kcal: 260, protein: 8, carbs: 54, fat: 3, fiber: 4 },
  { name: 'Plátano maduro frito en aceite tradicional', portion: '1 plátano (180g)', kcal: 375, protein: 3, carbs: 62, fat: 14, fiber: 3 },
  { name: 'Pechuga de pollo a la plancha con hierbas', portion: '150g cocida', kcal: 220, protein: 44, carbs: 0, fat: 4, fiber: 0 },
  { name: 'Frijoles rojos cocidos parados (olla)', portion: '1 taza (180g)', kcal: 215, protein: 14, carbs: 38, fat: 1, fiber: 12 },
  { name: 'Tortilla de maíz nixtamalizado artesanal', portion: '2 unidades (60g)', kcal: 130, protein: 3, carbs: 26, fat: 1, fiber: 3 },
  { name: 'Nacatamal tradicional de pollo con arroz', portion: '1 unidad mediana (300g)', kcal: 540, protein: 19, carbs: 52, fat: 28, fiber: 4 },
  { name: 'Cuajada fresca hondureña artesanal', portion: '60g', kcal: 160, protein: 12, carbs: 2, fat: 12, fiber: 0 },
  { name: 'Chismol fresco con tomate, cebolla y culantro', portion: '1 taza (150g)', kcal: 35, protein: 1, carbs: 7, fat: 0, fiber: 2 },
  { name: 'Huevos revueltos con tomate y cebolla', portion: '2 huevos (120g)', kcal: 175, protein: 13, carbs: 3, fat: 12, fiber: 1 },
  { name: 'Batido de proteína de suero con agua', portion: '1 scoop (30g)', kcal: 120, protein: 24, carbs: 2, fat: 1.5, fiber: 0 },
  { name: 'Avena cocida con canela y agua', portion: '1 taza (200g)', kcal: 150, protein: 5, carbs: 27, fat: 3, fiber: 4 },
  { name: 'Tajadas de plátano verde fritas (estilo catracho)', portion: '100g', kcal: 310, protein: 2, carbs: 48, fat: 13, fiber: 3 }
];

export const SEED_SOCIAL_PARTNERS = [
  {
    id: 'user-carlos-hn',
    name: 'Carlos Mendoza',
    username: '@carlos_lift_hn',
    avatar: '🏋️‍♂️',
    city: 'Tegucigalpa',
    gym: 'Smart Fit - Mall Las Cascadas',
    goal: 'bulk',
    goalLabel: 'Volumen Limpio',
    level: 'Intermedio (3 años)',
    bio: 'Ingeniero y atleta de fuerza. Buscando partner para días pesados de Empuje/Pierna por las tardes.',
    streak: 18,
    workoutsCount: 142,
    prs: { bench: '105 kg', squat: '140 kg', deadlift: '175 kg' },
    isFollowing: false
  },
  {
    id: 'user-sofia-tegucigalpa',
    name: 'Sofía Reyes',
    username: '@sofi_fitness_tgu',
    avatar: '🏃‍♀️',
    city: 'Tegucigalpa',
    gym: 'Max Fitness - Plaza Morazán',
    goal: 'cut',
    goalLabel: 'Definición & Glúteos',
    level: 'Avanzado (5 años)',
    bio: 'Nutrición basada en ciencia + sobrecarga progresiva. Entreno de 6:00 AM a 7:30 AM.',
    streak: 34,
    workoutsCount: 285,
    prs: { bench: '60 kg', squat: '110 kg', deadlift: '130 kg' },
    isFollowing: true
  },
  {
    id: 'user-diego-hn',
    name: 'Diego Almendares',
    username: '@diego_power_504',
    avatar: '⚡',
    city: 'Tegucigalpa',
    gym: 'Planet Fitness - Los Próceres',
    goal: 'maintain',
    goalLabel: 'Fuerza Funcional',
    level: 'Principiante / Intermedio',
    bio: 'Mejorando técnica en básicos y consistencia diaria. Amante de las baleadas proteicas.',
    streak: 12,
    workoutsCount: 64,
    prs: { bench: '85 kg', squat: '115 kg', deadlift: '145 kg' },
    isFollowing: false
  },
  {
    id: 'user-valeria-sps',
    name: 'Valeria Castro',
    username: '@valeria_gym_sps',
    avatar: '💪',
    city: 'San Pedro Sula',
    gym: 'Smart Fit Multiplaza',
    goal: 'bulk',
    goalLabel: 'Hipertrofia Total',
    level: 'Intermedio (2 años)',
    bio: 'Enfocada en progresión continua y superávit controlado. Siempre con buena vibra.',
    streak: 22,
    workoutsCount: 178,
    prs: { bench: '55 kg', squat: '95 kg', deadlift: '120 kg' },
    isFollowing: false
  }
];

export const SEED_POSTS = [
  {
    id: 'post-1',
    authorId: 'user-carlos-hn',
    authorName: 'Carlos Mendoza',
    authorUsername: '@carlos_lift_hn',
    authorAvatar: '🏋️‍♂️',
    gym: 'Smart Fit - Mall Las Cascadas',
    timestamp: Date.now() - 3600000 * 2, // 2 hours ago
    type: 'workout',
    title: 'Día de Empuje Pesado Destrozado 🔥',
    content: 'Completé 4 series de 8 reps con 95 kg en Banco Plano. La sobrecarga progresiva que sugirió FitMate se sintió impecable en el tríceps y deltoides.',
    stats: { sets: 18, volume: '8,450 kg', duration: '68 min' },
    likes: 14,
    hasLiked: false,
    comments: [
      { id: 'c-1', author: 'Sofía Reyes', text: '¡Esa técnica de retracción escapular rinde frutos! Buena marca.' }
    ]
  },
  {
    id: 'post-2',
    authorId: 'user-sofia-tegucigalpa',
    authorName: 'Sofía Reyes',
    authorUsername: '@sofi_fitness_tgu',
    authorAvatar: '🏃‍♀️',
    gym: 'Max Fitness - Plaza Morazán',
    timestamp: Date.now() - 3600000 * 5, // 5 hours ago
    type: 'meal',
    title: 'Almuerzo Catracho Alto en Proteína 🥑🥩',
    content: 'Pechuga de pollo al limón con frijoles parados y tajadas de plátano en freidora de aire. 48g de proteína total y cero remordimientos.',
    stats: { kcal: '480 kcal', protein: '48g', carbs: '45g', fat: '11g' },
    likes: 27,
    hasLiked: true,
    comments: [
      { id: 'c-2', author: 'Diego Almendares', text: 'El plátano en airfryer con frijoles es la gloria de los dioses.' }
    ]
  },
  {
    id: 'post-3',
    authorId: 'user-diego-hn',
    authorName: 'Diego Almendares',
    authorUsername: '@diego_power_504',
    authorAvatar: '⚡',
    gym: 'Planet Fitness - Los Próceres',
    timestamp: Date.now() - 3600000 * 18, // 18 hours ago
    type: 'workout',
    title: 'Nuevo Récord Personal en Sentadilla 💥',
    content: 'Racha de 12 días activa. Logré romper mi marca previa subiendo a 115 kg con profundidad perfecta. ¡Buscando partner para piernas los sábados!',
    stats: { sets: 16, volume: '6,200 kg', duration: '55 min' },
    likes: 19,
    hasLiked: false,
    comments: []
  }
];

export const FALLBACK_ROUTINE_PUSH_PULL_LEGS = {
  splitName: 'Push / Pull / Legs (Empuje, Tirón, Pierna)',
  overview: 'Programa clásico de hipertrofia de 3 a 6 días semanales, optimizado para máxima recuperación muscular y sobrecarga progresiva en movimientos multiarticulares.',
  schedule: [
    {
      dayName: 'Día 1: Empuje (Pecho, Hombro Frontal/Lateral, Tríceps)',
      focus: 'Pectoral mayor, deltoides y tríceps braquial',
      exercises: [
        {
          name: 'Press de Banca Plano con Barra',
          machine: 'Banco Plano y Barra Olímpica',
          startingWeight: 'Barra + 10-15 kg por lado',
          sets: 4,
          reps: '6-8 reps',
          restSec: 120,
          overloadRule: 'Al completar 4 series de 8 reps con técnica controlada, añade 2.5 kg en la sesión siguiente.',
          formCue: 'Retrae y deprime escápulas, arqueo natural lumbar, codos a 45 grados del torso.'
        },
        {
          name: 'Press Inclinado con Mancuernas',
          machine: 'Banco Reclinable a 30° y Mancuernas',
          startingWeight: 'Mancuernas de 14-18 kg c/u',
          sets: 3,
          reps: '8-10 reps',
          restSec: 90,
          overloadRule: 'Incrementa el peso cuando la última repetición suba sin pérdida de trayectoria simétrica.',
          formCue: 'Baja sintiendo el estiramiento en la porción clavicular del pectoral sin rebotar abajo.'
        },
        {
          name: 'Elevaciones Laterales en Polea o con Mancuerna',
          machine: 'Polea Baja o Mancuernas',
          startingWeight: 'Mancuernas de 6-8 kg o Polea 5 kg',
          sets: 4,
          reps: '12-15 reps',
          restSec: 60,
          overloadRule: 'Prioriza volumen y control: añade 1 repetición por serie antes de subir carga.',
          formCue: 'Dirige el movimiento con los codos en el plano escapular (ligeramente hacia el frente).'
        },
        {
          name: 'Extensiones de Tríceps en Polea Alta con Cuerda',
          machine: 'Polea Alta con Cuerda',
          startingWeight: 'Placas de 15-20 kg',
          sets: 3,
          reps: '10-12 reps',
          restSec: 60,
          overloadRule: 'Abre la cuerda al final de cada repetición bloqueando un instante en contracción pico.',
          formCue: 'Mantén los codos pegados a los costados sin balancear la espalda.'
        }
      ]
    },
    {
      dayName: 'Día 2: Tirón (Espalda Completa, Deltoides Posterior, Bíceps)',
      focus: 'Dorsal ancho, romboides, trapecio y flexores de codo',
      exercises: [
        {
          name: 'Jalón al Pecho con Agarre Neutro o Prono',
          machine: 'Máquina de Jalón al Pecho (Lat Pulldown)',
          startingWeight: 'Placas de 40-50 kg',
          sets: 4,
          reps: '8-10 reps',
          restSec: 90,
          overloadRule: 'Añade 2.5 kg cuando completes todas las series sin balancear el torso hacia atrás.',
          formCue: 'Inicia bajando las escápulas y lleva la barra hacia la clavícula sacando el pecho.'
        },
        {
          name: 'Remo en Polea Baja o con Mancuerna con Apoyo',
          machine: 'Polea Baja con Agarre V o Banco con Mancuernas',
          startingWeight: 'Mancuerna de 16-20 kg o 35 kg en polea',
          sets: 3,
          reps: '10-12 reps',
          restSec: 90,
          overloadRule: 'Sostén la contracción durante 1 segundo antes de permitir la fase excéntrica lenta.',
          formCue: 'Dirige el codo hacia la cadera en lugar de tirar solo con el bíceps.'
        },
        {
          name: 'Face Pulls en Polea Alta',
          machine: 'Polea Alta con Cuerda',
          startingWeight: '12-15 kg en polea',
          sets: 3,
          reps: '12-15 reps',
          restSec: 60,
          overloadRule: 'Enfócate en rotación externa del hombro para salud del manguito rotador.',
          formCue: 'Lleva la cuerda hacia los ojos/frente separando las manos.'
        },
        {
          name: 'Curl de Bíceps en Banco Inclinado',
          machine: 'Banco a 60° con Mancuernas',
          startingWeight: 'Mancuernas de 8-10 kg',
          sets: 3,
          reps: '10-12 reps',
          restSec: 60,
          overloadRule: 'Aumenta 1 kg por mancuerna cuando completes 12 reps con estiramiento completo.',
          formCue: 'Deja los brazos colgar en la vertical para estirar la cabeza larga del bíceps.'
        }
      ]
    },
    {
      dayName: 'Día 3: Pierna & Core (Cuádriceps, Isquiosurales, Glúteos y Gemelos)',
      focus: 'Tren inferior completo y estabilidad lumbopélvica',
      exercises: [
        {
          name: 'Prensa de Piernas Inclinada a 45°',
          machine: 'Prensa de Piernas (Leg Press)',
          startingWeight: 'Carro + 2 discos de 20 kg por lado',
          sets: 4,
          reps: '8-10 reps',
          restSec: 120,
          overloadRule: 'Añade un disco de 5 kg por lado al dominar el rango completo sin despegar la cadera.',
          formCue: 'Pies a la anchura de hombros; no bloquees las rodillas al extender.'
        },
        {
          name: 'Sentadilla Búlgara con Mancuernas',
          machine: 'Banco Plano y Mancuernas',
          startingWeight: 'Mancuernas de 8-12 kg c/u',
          sets: 3,
          reps: '10 reps por pierna',
          restSec: 90,
          overloadRule: 'Progresa primero en estabilidad y control antes de cargar peso extra.',
          formCue: 'Inclina el torso 15 grados hacia adelante para mayor activación de glúteo e isquios.'
        },
        {
          name: 'Curl Femoral Acostado o Sentado',
          machine: 'Máquina de Curl Femoral',
          startingWeight: 'Placas de 25-30 kg',
          sets: 3,
          reps: '10-12 reps',
          restSec: 60,
          overloadRule: 'Controla la bajada en 3 segundos excéntricos para proteger los ligamentos de rodilla.',
          formCue: 'Mantén la pelvis presionada contra la almohadilla durante toda la serie.'
        },
        {
          name: 'Elevación de Talones de Pie para Gemelos',
          machine: 'Máquina Smith o Escalón con Mancuerna',
          startingWeight: 'Peso corporal + mancuerna de 16 kg',
          sets: 4,
          reps: '15 reps',
          restSec: 60,
          overloadRule: 'Pausa de 2 segundos en el fondo del estiramiento.',
          formCue: 'Empuja con la base del dedo gordo para reclutar el gastrocnemio completo.'
        }
      ]
    }
  ]
};
