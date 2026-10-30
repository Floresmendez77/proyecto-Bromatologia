/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Firebase Foundation Module - Modular SDK (v10)
 * Google Sign-in + Cloud Firestore synchronization
 */

import { FIREBASE_CONFIG } from '../config.js';

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let isInitialized = false;
let initPromise = null;

const FIREBASE_SDK_BASE = 'https://www.gstatic.com/firebasejs/10.12.2';

/**
 * Validates if the user configured a real Firebase API Key
 */
export function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_CONFIG &&
    FIREBASE_CONFIG.apiKey &&
    !FIREBASE_CONFIG.apiKey.includes('YOUR_FIREBASE_API_KEY') &&
    FIREBASE_CONFIG.projectId &&
    !FIREBASE_CONFIG.projectId.includes('fitmate-honduras')
  );
}

/**
 * Initializes Firebase App, Auth, and Firestore
 */
export async function initFirebase(onAuthStateCallback) {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!isFirebaseConfigured()) {
        console.info('[FitMate Firebase] Usando almacenamiento local (configuración de Firebase pendiente en config.js).');
        if (typeof onAuthStateCallback === 'function') {
          onAuthStateCallback(null, false);
        }
        return { isReady: false, reason: 'NOT_CONFIGURED' };
      }

      // Dynamic import of Firebase 10 Modular SDK from Google CDN
      const { initializeApp } = await import(`${FIREBASE_SDK_BASE}/firebase-app.js`);
      const { getAuth, onAuthStateChanged } = await import(`${FIREBASE_SDK_BASE}/firebase-auth.js`);
      const { getFirestore } = await import(`${FIREBASE_SDK_BASE}/firebase-firestore.js`);

      app = initializeApp(FIREBASE_CONFIG);
      auth = getAuth(app);
      db = getFirestore(app);
      isInitialized = true;

      onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (typeof onAuthStateCallback === 'function') {
          onAuthStateCallback(user, true);
        }
      });

      return { isReady: true, app, auth, db };
    } catch (err) {
      console.warn('[FitMate Firebase] Error al inicializar Firebase, fallback local activo:', err.message);
      if (typeof onAuthStateCallback === 'function') {
        onAuthStateCallback(null, false);
      }
      return { isReady: false, error: err };
    }
  })();

  return initPromise;
}

/**
 * Google Sign-In with 30s timeout and error handling
 */
export async function signInWithGoogle() {
  if (!auth) {
    await initFirebase();
  }

  if (!auth) {
    throw new Error('Firebase no está configurado. Revisa los valores en src/public/config.js');
  }

  const { GoogleAuthProvider, signInWithPopup } = await import(`${FIREBASE_SDK_BASE}/firebase-auth.js`);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // 30s timeout promise
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('El inicio de sesión con Google tardó más de 30 segundos (tiempo de espera agotado).'));
    }, 30000);
  });

  try {
    const userCredential = await Promise.race([
      signInWithPopup(auth, provider),
      timeoutPromise
    ]);
    clearTimeout(timeoutId);
    currentUser = userCredential.user;
    return currentUser;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Sign out user
 */
export async function signOutUser() {
  if (!auth) return;
  const { signOut } = await import(`${FIREBASE_SDK_BASE}/firebase-auth.js`);
  await signOut(auth);
  currentUser = null;
}

export function getCurrentUser() {
  return currentUser || auth?.currentUser || null;
}

/**
 * Fetch a document from Firestore with 30s timeout
 */
export async function getFirestoreDoc(collectionPath, docId) {
  if (!db || !currentUser) return null;

  const { doc, getDoc } = await import(`${FIREBASE_SDK_BASE}/firebase-firestore.js`);
  const docRef = doc(db, collectionPath, docId);

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout de lectura en Firestore (30s)')), 30000);
  });

  try {
    const snap = await Promise.race([getDoc(docRef), timeoutPromise]);
    clearTimeout(timeoutId);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[FitMate Firestore] Error leyendo ${collectionPath}/${docId}:`, err.message);
    return null;
  }
}

/**
 * Save or merge a document in Firestore with 30s timeout
 */
export async function setFirestoreDoc(collectionPath, docId, data) {
  if (!db || !currentUser) return false;

  const { doc, setDoc } = await import(`${FIREBASE_SDK_BASE}/firebase-firestore.js`);
  const docRef = doc(db, collectionPath, docId);

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout de escritura en Firestore (30s)')), 30000);
  });

  try {
    await Promise.race([
      setDoc(docRef, data, { merge: true }),
      timeoutPromise
    ]);
    clearTimeout(timeoutId);
    return true;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[FitMate Firestore] Error guardando ${collectionPath}/${docId}:`, err.message);
    return false;
  }
}
