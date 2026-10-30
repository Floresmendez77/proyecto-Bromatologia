/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import {
  SEED_GYMS,
  SEED_SOCIAL_PARTNERS,
  SEED_POSTS,
  FALLBACK_ROUTINE_PUSH_PULL_LEGS
} from './routineData.js';
import { calculateTargets, estimateBodyType } from './nutritionCalc.js';
import { getCurrentUser, getFirestoreDoc, setFirestoreDoc } from './firebase.js';

const STORAGE_KEYS = {
  PROFILE: 'fitmate_profile_v1',
  FOOD_LOGS: 'fitmate_food_logs_v1',
  ROUTINE: 'fitmate_routine_v1',
  WORKOUT_LOGS: 'fitmate_workout_logs_v1',
  GYMS: 'fitmate_gyms_v1',
  ACTIVE_GYM_ID: 'fitmate_active_gym_id_v1',
  POSTS: 'fitmate_posts_v1',
  PARTNERS: 'fitmate_partners_v1',
  SUPPLEMENTS: 'fitmate_supplements_v1'
};

export const DEFAULT_PROFILE = {
  name: 'Atleta Catracho',
  username: '@catracho_fit',
  avatar: '⚡',
  age: 24,
  sex: 'male',
  height: 175,
  weight: 76,
  goal: 'cut', // 'cut' | 'bulk' | 'maintain'
  activity: 'moderate', // 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete'
  experience: 'intermedio', // 'principiante' | 'intermedio' | 'avanzado'
  injuries: 'Ninguna',
  dietRestrictions: 'Ninguna',
  city: 'Tegucigalpa',
  streak: 7,
  prs: {
    bench: '95 kg',
    squat: '130 kg',
    deadlift: '160 kg'
  },
  targets: {
    bmr: 1739,
    tdee: 2695,
    targetCalories: 2245,
    targetProtein: 167,
    targetCarbs: 241,
    targetFat: 68,
    targetFiber: 31
  },
  bodyType: {
    type: 'Mesomorfo',
    title: 'Predominancia Mesomorfa',
    bmi: 24.8,
    explanation: 'Estructura atlética equilibrada con buena capacidad para responder al estímulo de hipertrofia y regular la grasa corporal eficientemente.',
    trainingTip: 'Respondes excelente a sobrecarga progresiva en rangos de 6-12 repeticiones y descansos de 90 a 120 segundos.'
  }
};

export function getThemeCookie() {
  const match = document.cookie.match(/(?:^|;\s*)theme=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setThemeCookie(theme) {
  const isSecure = window.location.protocol === 'https:';
  const maxAge = 60 * 60 * 24 * 365;
  let cookieString = `theme=${encodeURIComponent(theme)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (isSecure) {
    cookieString += '; Secure';
  }
  document.cookie = cookieString;
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      const initial = {
        ...DEFAULT_PROFILE,
        targets: calculateTargets(DEFAULT_PROFILE),
        bodyType: estimateBodyType(DEFAULT_PROFILE.weight, DEFAULT_PROFILE.height, DEFAULT_PROFILE.goal)
      };
      saveProfile(initial);
      return initial;
    }
    const profile = JSON.parse(raw);
    if (!profile.targets || !profile.targets.targetCalories) {
      profile.targets = calculateTargets(profile);
      saveProfile(profile);
    }
    if (!profile.bodyType) {
      profile.bodyType = estimateBodyType(profile.weight, profile.height, profile.goal);
      saveProfile(profile);
    }
    return profile;
  } catch {
    return {
      ...DEFAULT_PROFILE,
      targets: calculateTargets(DEFAULT_PROFILE),
      bodyType: estimateBodyType(DEFAULT_PROFILE.weight, DEFAULT_PROFILE.height, DEFAULT_PROFILE.goal)
    };
  }
}

async function syncFieldToFirestore(field, value) {
  try {
    const user = getCurrentUser();
    if (!user) return;
    await setFirestoreDoc('users', user.uid, {
      [field]: value,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn(`[storage] Error sincronizando ${field} con Firestore:`, err.message);
  }
}

export async function syncUserStorageWithFirestore(uid) {
  if (!uid) return;
  try {
    const remoteData = await getFirestoreDoc('users', uid);
    if (remoteData) {
      if (remoteData.profile) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(remoteData.profile));
      }
      if (Array.isArray(remoteData.foodLogs)) {
        localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(remoteData.foodLogs));
      }
      if (Array.isArray(remoteData.workoutLogs)) {
        localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(remoteData.workoutLogs));
      }
      if (remoteData.activeGymId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_GYM_ID, remoteData.activeGymId);
      }
      if (remoteData.routine) {
        localStorage.setItem(STORAGE_KEYS.ROUTINE, JSON.stringify(remoteData.routine));
      }
    } else {
      // First time cloud sync: seed remote document from current local data
      const currentProfile = getProfile();
      const currentFoodLogs = getFoodLogs();
      const currentWorkoutLogs = getWorkoutLogs();
      const currentGym = getActiveGym();
      const currentRoutine = getActiveRoutine();

      await setFirestoreDoc('users', uid, {
        profile: currentProfile,
        foodLogs: currentFoodLogs,
        workoutLogs: currentWorkoutLogs,
        activeGymId: currentGym?.id || null,
        routine: currentRoutine,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  } catch (err) {
    console.warn('[storage] Error en sincronización inicial con Firestore:', err.message);
  }
}

export function saveProfile(profile) {
  try {
    profile.targets = calculateTargets(profile);
    profile.bodyType = estimateBodyType(profile.weight, profile.height, profile.goal);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    syncFieldToFirestore('profile', profile);
    return profile;
  } catch {
    return profile;
  }
}

export function getFoodLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOOD_LOGS);
    if (!raw) {
      // Seed default breakfast
      const defaultLog = [
        {
          id: 'meal-1',
          timestamp: Date.now() - 3600000 * 4,
          name: 'Baleada con frijoles, huevo y cuajada',
          itemCount: '1 baleada grande',
          portion: '1 unidad (180g)',
          kcal: 380,
          protein: 16,
          carbs: 44,
          fat: 14,
          fiber: 6,
          healthierPrep: 'Tortilla de maíz nixtamalizado y cuajada fresca baja en sal.',
          whatToEatNext: 'Pechuga de pollo con ensalada verde para el almuerzo.'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(defaultLog));
      return defaultLog;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return Object.values(parsed);
    return [];
  } catch {
    return [];
  }
}

export function addFoodLog(meal) {
  const logs = getFoodLogs();
  const updated = [meal, ...logs];
  try {
    localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  syncFieldToFirestore('foodLogs', updated);
  return updated;
}

export function deleteFoodLog(mealId) {
  const logs = getFoodLogs().filter(m => m.id !== mealId);
  try {
    localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(logs));
  } catch {
    // Ignore error
  }
  syncFieldToFirestore('foodLogs', logs);
  return logs;
}

export function clearFoodLogs() {
  try {
    localStorage.removeItem(STORAGE_KEYS.FOOD_LOGS);
  } catch {
    // Ignore error
  }
  syncFieldToFirestore('foodLogs', []);
}

export function getDailyTotals() {
  const logs = getFoodLogs();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayLogs = logs.filter(item => item.timestamp >= startOfDay.getTime());

  return todayLogs.reduce(
    (acc, cur) => {
      acc.kcal += cur.kcal || 0;
      acc.protein += cur.protein || 0;
      acc.carbs += cur.carbs || 0;
      acc.fat += cur.fat || 0;
      acc.fiber += cur.fiber || 0;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function getActiveRoutine() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTINE);
    if (!raw) {
      saveActiveRoutine(FALLBACK_ROUTINE_PUSH_PULL_LEGS);
      return FALLBACK_ROUTINE_PUSH_PULL_LEGS;
    }
    return JSON.parse(raw);
  } catch {
    return FALLBACK_ROUTINE_PUSH_PULL_LEGS;
  }
}

export function saveActiveRoutine(routine) {
  try {
    localStorage.setItem(STORAGE_KEYS.ROUTINE, JSON.stringify(routine));
  } catch {
    // Ignore error
  }
  syncFieldToFirestore('routine', routine);
}

export function getGyms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GYMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GYMS, JSON.stringify(SEED_GYMS));
      return SEED_GYMS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_GYMS;
  }
}

export function saveGym(gym) {
  const gyms = getGyms();
  const exists = gyms.find(g => g.id === gym.id);
  const updated = exists ? gyms.map(g => g.id === gym.id ? gym : g) : [...gyms, gym];
  try {
    localStorage.setItem(STORAGE_KEYS.GYMS, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  return updated;
}

export function getActiveGym() {
  const gyms = getGyms();
  const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_GYM_ID) || gyms[0]?.id;
  return gyms.find(g => g.id === activeId) || gyms[0];
}

export function setActiveGymId(gymId) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GYM_ID, gymId);
  } catch {
    // Ignore error
  }
  syncFieldToFirestore('activeGymId', gymId);
}

export function getSocialPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(SEED_POSTS));
      return SEED_POSTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_POSTS;
  }
}

export function addSocialPost(post) {
  const posts = getSocialPosts();
  const updated = [post, ...posts];
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  return updated;
}

export function togglePostLike(postId) {
  const posts = getSocialPosts();
  const updated = posts.map(p => {
    if (p.id === postId) {
      const hasLiked = !p.hasLiked;
      return {
        ...p,
        hasLiked,
        likes: hasLiked ? p.likes + 1 : Math.max(p.likes - 1, 0)
      };
    }
    return p;
  });
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  return updated;
}

export function addPostComment(postId, commentText, authorName = 'Atleta Catracho') {
  const posts = getSocialPosts();
  const updated = posts.map(p => {
    if (p.id === postId) {
      const comments = p.comments || [];
      return {
        ...p,
        comments: [...comments, { id: 'c_' + Date.now(), author: authorName, text: commentText }]
      };
    }
    return p;
  });
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  return updated;
}

export function getPartners() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTNERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(SEED_SOCIAL_PARTNERS));
      return SEED_SOCIAL_PARTNERS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_SOCIAL_PARTNERS;
  }
}

export function toggleFollowPartner(partnerId) {
  const partners = getPartners();
  const updated = partners.map(partner => {
    if (partner.id === partnerId) {
      return { ...partner, isFollowing: !partner.isFollowing };
    }
    return partner;
  });
  try {
    localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  return updated;
}

export function getSavedSupplements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLEMENTS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSupplements(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPLEMENTS, JSON.stringify(data));
  } catch {
    // Ignore error
  }
}

export function getWorkoutLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWorkoutLog(log) {
  const logs = getWorkoutLogs();
  const updated = [log, ...logs];
  try {
    localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  syncFieldToFirestore('workoutLogs', updated);
  return updated;
}

