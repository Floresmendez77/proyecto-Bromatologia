/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * FitMate Gamification Engine - Stealth Dark Luxe Streaks & Achievement Badges
 */

export const HONDURAS_ACHIEVEMENTS = [
  {
    id: 'rey_baleada_fitness',
    title: 'Rey de la Baleada Fitness',
    desc: 'Registraste 5 comidas típicas catrachas alcanzando 25g+ de proteína.',
    icon: '🫓',
    accentColor: 'var(--accent-platinum)',
    checkUnlock: (foodLogs = []) => {
      if (!Array.isArray(foodLogs)) foodLogs = Object.values(foodLogs || {});
      const match = foodLogs.filter(f => /baleada|frijol|plátano|cuajada/i.test(f?.name || '') && (f?.protein || 0) >= 25);
      return match.length >= 5;
    }
  },
  {
    id: 'club_300_sbd',
    title: 'Club de los 300 kg (SBD)',
    desc: 'Total de marcas personales (Banca + Sentadilla + Peso Muerto) superior a 300 kg.',
    icon: '⚡',
    accentColor: 'var(--accent-titanium-light)',
    checkUnlock: (profile = {}) => {
      const b = parseFloat(profile.prs?.bench) || 0;
      const s = parseFloat(profile.prs?.squat) || 0;
      const d = parseFloat(profile.prs?.deadlift) || 0;
      return (b + s + d) >= 300;
    }
  },
  {
    id: 'disciplina_morazan',
    title: 'Disciplina Morazánica',
    desc: 'Racha ininterrumpida de 14 días consecutivos completando rutinas o comidas.',
    icon: '🔥',
    accentColor: 'var(--accent-platinum)',
    checkUnlock: (profile = {}) => (profile.streak || 0) >= 14
  },
  {
    id: 'bromatologia_visionaria',
    title: 'Bromatología Pura',
    desc: 'Has escaneado más de 10 comidas con el análisis multimodal de Gemini 3.8 Flash.',
    icon: '📸',
    accentColor: 'var(--accent-matte-emerald-light)',
    checkUnlock: (foodLogs = []) => {
      if (!Array.isArray(foodLogs)) foodLogs = Object.values(foodLogs || {});
      const aiScans = foodLogs.filter(f => f && (f.fromAi === true || f.aiVerified === true));
      return aiScans.length >= 10;
    }
  }
];

/**
 * Returns dynamic flame visual attributes based on user streak length
 * Minimalist Stealth Metal & Platinum Luster
 */
export function getStreakFlameConfig(streakDays = 0) {
  if (streakDays >= 30) {
    return {
      tier: 'legendary',
      label: 'Fuego Platino Legendario',
      gradient: 'linear-gradient(135deg, #ffffff, #d1d5db, #9ba3af)',
      glow: '0 0 20px rgba(255, 255, 255, 0.4)',
      icon: '🔥'
    };
  }
  if (streakDays >= 7) {
    return {
      tier: 'blazing',
      label: 'Racha Alta Titanio',
      gradient: 'var(--accent-platinum)',
      glow: '0 0 16px rgba(255, 255, 255, 0.25)',
      icon: '🔥'
    };
  }
  return {
    tier: 'spark',
    label: 'Chispa Inicial',
    gradient: 'var(--accent-platinum-soft)',
    glow: '0 0 8px rgba(255, 255, 255, 0.15)',
    icon: '⚡'
  };
}
