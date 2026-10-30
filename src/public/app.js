/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import {
  processAndResizeImage,
  createThumbnail,
  startWebcam,
  captureWebcamFrame,
  stopWebcam
} from './modules/imageProcessor.js';

import {
  analyzeFoodImage,
  generateWorkoutRoutine,
  getSupplementsAdvice
} from './modules/apiClient.js';

import {
  getProfile,
  saveProfile,
  getFoodLogs,
  addFoodLog,
  deleteFoodLog,
  getDailyTotals,
  getActiveRoutine,
  saveActiveRoutine,
  getGyms,
  saveGym,
  getActiveGym,
  setActiveGymId,
  getSocialPosts,
  addSocialPost,
  togglePostLike,
  addPostComment,
  getPartners,
  toggleFollowPartner,
  getSavedSupplements,
  saveSupplements,
  getThemeCookie,
  setThemeCookie,
  syncUserStorageWithFirestore
} from './modules/storage.js';

import {
  initFirebase,
  signInWithGoogle,
  signOutUser,
  getCurrentUser,
  isFirebaseConfigured
} from './modules/firebase.js';

import {
  computeDailyVerdict
} from './modules/nutritionCalc.js';

import {
  HONDURAN_FOOD_DATABASE
} from './modules/routineData.js';

import {
  renderDashboardMacros,
  renderMealLogList,
  renderFoodScanResult,
  renderManualFoodSearchResults,
  renderRoutineView,
  renderGymsView,
  renderSupplementsView,
  renderSocialView,
  renderProfileView,
  createEl
} from './modules/renderer.js';

import { FitState } from './modules/FitState.js';
import { initSpotlightCards } from './modules/spotlightCoordinator.js';
import { globalRestTimer } from './modules/GymRestTimer.js';
import { getStreakFlameConfig } from './modules/gamification.js';

// Global Reactive FitStore
export const fitStore = new FitState({
  profile: getProfile(),
  foodLogs: getFoodLogs(),
  routine: getActiveRoutine(),
  gyms: getGyms(),
  activeGymId: getActiveGym()?.id,
  socialPosts: getSocialPosts()
});
window.fitStore = fitStore;

// Global State
let currentView = 'dashboard';
let currentFile = null;
let currentResizedBlob = null;
let currentThumbnail = null;
let isWebcamStreaming = false;

// DOM References
const viewTitle = document.getElementById('view-title');
const srAnnouncer = document.getElementById('sr-announcer');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');

// Sidebar user elements
const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
const sidebarUserName = document.getElementById('sidebar-user-name');
const sidebarUserGym = document.getElementById('sidebar-user-gym');
const sidebarStreakCount = document.getElementById('sidebar-streak-count');
const topGymName = document.getElementById('top-gym-name');
const topActiveGymPill = document.getElementById('top-active-gym-pill');
const authBtn = document.getElementById('auth-btn');
const authBtnIcon = document.getElementById('auth-btn-icon');
const authBtnText = document.getElementById('auth-btn-text');
const authOverlay = document.getElementById('auth-overlay');
const googleSigninBtn = document.getElementById('google-signin-btn');
const guestContinueBtn = document.getElementById('guest-continue-btn');
const authErrorMsg = document.getElementById('auth-error-msg');

// View Containers
const views = {
  dashboard: document.getElementById('view-dashboard'),
  scanner: document.getElementById('view-scanner'),
  trainer: document.getElementById('view-trainer'),
  gyms: document.getElementById('view-gyms'),
  supplements: document.getElementById('view-supplements'),
  social: document.getElementById('view-social'),
  profile: document.getElementById('view-profile')
};

// Dashboard specific containers
const dashboardMacrosContainer = document.getElementById('dashboard-macros-container');
const dailyMealsContainer = document.getElementById('daily-meals-container');
const quickFoodSearch = document.getElementById('quick-food-search');
const quickFoodResults = document.getElementById('quick-food-results');
const dashboardRoutineSnapshot = document.getElementById('dashboard-routine-snapshot');
const dashboardPartnerSpotlight = document.getElementById('dashboard-partner-spotlight');
const quickScanBtn = document.getElementById('quick-scan-btn');
const gotoTrainerBtn = document.getElementById('goto-trainer-btn');
const gotoSocialBtn = document.getElementById('goto-social-btn');

// Scanner specific containers
const webcamVideo = document.getElementById('webcam-video');
const cameraLiveBox = document.getElementById('camera-live-box');
const startWebcamBtn = document.getElementById('start-webcam-btn');
const closeCameraBtn = document.getElementById('close-camera-btn');
const captureSnapshotBtn = document.getElementById('capture-snapshot-btn');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const cameraDirectInput = document.getElementById('camera-direct-input');
const scanPreviewPanel = document.getElementById('scan-preview-panel');
const scanPreviewImg = document.getElementById('scan-preview-img');
const scanPreviewName = document.getElementById('scan-preview-name');
const scanPreviewDims = document.getElementById('scan-preview-dims');
const runAiScanBtn = document.getElementById('run-ai-scan-btn');
const scanLoadingState = document.getElementById('scan-loading-state');
const scanResultsContainer = document.getElementById('scan-results-container');

// Other View Containers
const routineContainer = document.getElementById('routine-container');
const generateAiRoutineBtn = document.getElementById('generate-ai-routine-btn');
const gymsContainer = document.getElementById('gyms-container');
const supplementsContainer = document.getElementById('supplements-container');
const socialContainer = document.getElementById('social-container');
const profileContainer = document.getElementById('profile-container');

// Screen reader announcements
function announce(message) {
  if (srAnnouncer) {
    srAnnouncer.textContent = message;
  }
}

// Theme Handlers
function initTheme() {
  const savedTheme = getThemeCookie() || 'dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      setThemeCookie(nextTheme);
    });
  }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeIcon) themeIcon.textContent = '☀️';
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-label', 'Cambiar a tema claro');
      themeToggleBtn.setAttribute('aria-pressed', 'true');
    }
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    if (themeIcon) themeIcon.textContent = '🌙';
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-label', 'Cambiar a tema oscuro');
      themeToggleBtn.setAttribute('aria-pressed', 'false');
    }
  }
}

// Navigation and View Switching
export function switchView(targetView) {
  if (!views[targetView]) return;

  // If leaving scanner while camera active, shut it down
  if (currentView === 'scanner' && targetView !== 'scanner' && isWebcamStreaming) {
    stopCameraStream();
  }

  currentView = targetView;

  // Toggle DOM visibility
  Object.entries(views).forEach(([name, el]) => {
    if (el) {
      if (name === targetView) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Update Sidebar active state
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
    const isTarget = btn.getAttribute('data-view') === targetView;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-current', isTarget ? 'page' : 'false');
  });

  // Update Mobile Bottom Nav active state
  document.querySelectorAll('.bottom-nav-mobile .bottom-nav-btn').forEach((btn) => {
    const isTarget = btn.getAttribute('data-view') === targetView;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-current', isTarget ? 'page' : 'false');
  });

  // Update title and view renderers
  const titles = {
    dashboard: 'Dashboard Diario',
    scanner: 'Escáner Nutricional con IA',
    trainer: 'Entrenador Personal IA',
    gyms: 'Gimnasios y Equipamiento',
    supplements: 'Asesor de Suplementación',
    social: 'GymPartners Honduras',
    profile: 'Mi Perfil de Atleta'
  };

  if (viewTitle) {
    viewTitle.textContent = titles[targetView] || 'FitMate AI';
  }
  announce(`Sección abierta: ${titles[targetView] || targetView}`);

  // Trigger render logic
  switch (targetView) {
    case 'dashboard':
      renderDashboardView();
      break;
    case 'scanner':
      // Ready for scan
      break;
    case 'trainer':
      renderTrainerView();
      break;
    case 'gyms':
      renderGymsViewModule();
      break;
    case 'supplements':
      renderSupplementsViewModule();
      break;
    case 'social':
      renderSocialViewModule();
      break;
    case 'profile':
      renderProfileViewModule();
      break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Synchronize Sidebar and Header User info
function updateHeaderAndSidebarUser() {
  const profile = getProfile();
  const activeGym = getActiveGym();
  const user = getCurrentUser();

  if (sidebarUserAvatar) {
    if (user?.photoURL) {
      sidebarUserAvatar.textContent = '';
      const img = createEl('img');
      img.src = user.photoURL;
      img.alt = user.displayName || 'Avatar';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '50%';
      sidebarUserAvatar.appendChild(img);
    } else {
      sidebarUserAvatar.textContent = profile.avatar || '⚡';
    }
  }

  if (sidebarUserName) {
    sidebarUserName.textContent = (user?.displayName) || profile.name || 'Atleta Catracho';
  }
  if (sidebarUserGym) sidebarUserGym.textContent = `📍 ${activeGym.name}`;

  if (authBtnText) {
    authBtnText.textContent = user ? 'Cerrar Sesión' : 'Iniciar Sesión';
  }
  if (authBtnIcon) {
    authBtnIcon.textContent = user ? '🚪' : '👤';
  }

  const streakDays = profile.streak || 7;
  const flameConf = getStreakFlameConfig(streakDays);
  if (sidebarStreakCount) sidebarStreakCount.textContent = `${flameConf.icon} ${streakDays}`;

  const streakBadge = document.querySelector('.streak-badge');
  if (streakBadge) {
    streakBadge.className = `streak-badge flame-tier-${flameConf.tier}`;
    streakBadge.title = `${flameConf.label} (${streakDays} días consecutivos)`;
  }
  if (topGymName) topGymName.textContent = activeGym.name;
}

/* ==========================================================================
   MODULE 1 & 2: DASHBOARD & FOOD SCANNER
   ========================================================================== */

function renderDashboardView() {
  try {
    const profile = getProfile();
    const targets = (profile && profile.targets && profile.targets.targetCalories) ? profile.targets : calculateTargets(profile || DEFAULT_PROFILE);
    const consumed = getDailyTotals();
    const verdict = computeDailyVerdict(consumed, targets);

    // Render top Macro Rings & Coach Verdict
    if (dashboardMacrosContainer) {
      renderDashboardMacros(dashboardMacrosContainer, consumed, targets, verdict);
    }

    // Render Daily Food Log
    const logs = getFoodLogs();
    if (dailyMealsContainer) {
      renderMealLogList(dailyMealsContainer, logs, (mealId) => {
        deleteFoodLog(mealId);
        announce('Comida eliminada del diario.');
        renderDashboardView();
      });
    }

    // Render Dashboard Routine Snapshot
    if (dashboardRoutineSnapshot) {
      const routine = getActiveRoutine();
      dashboardRoutineSnapshot.textContent = '';
      if (routine && routine.schedule && routine.schedule[0]) {
        const dayOne = routine.schedule[0];
        const box = createEl('div', 'p-2');
        const splitTitle = createEl('h4', 'font-bold text-lime', routine.splitName);
        const dayLabel = createEl('p', 'text-sm text-muted mt-1', `${dayOne.dayName}: ${dayOne.focus}`);
        box.appendChild(splitTitle);
        box.appendChild(dayLabel);

        const exList = createEl('ul', 'mt-2');
        if (Array.isArray(dayOne.exercises)) {
          dayOne.exercises.slice(0, 3).forEach(ex => {
            const li = createEl('li', 'text-sm text-secondary mt-1', `• ${ex.name} (${ex.sets} × ${ex.reps})`);
            exList.appendChild(li);
          });
        }
        box.appendChild(exList);
        dashboardRoutineSnapshot.appendChild(box);
      }
    }

    // Render Dashboard GymPartner Spotlight
    if (dashboardPartnerSpotlight) {
      const partners = getPartners();
      dashboardPartnerSpotlight.textContent = '';
      const spotlight = partners && partners[0];

      if (spotlight) {
        const row = createEl('div', 'partner-spotlight-row');
        const av = createEl('div', 'partner-avatar-small', spotlight.avatar);
        const meta = createEl('div', 'spotlight-meta');
        meta.appendChild(createEl('strong', 'spotlight-name', spotlight.name));
        meta.appendChild(createEl('span', 'spotlight-gym text-muted text-xs', ` • ${spotlight.gym}`));
        meta.appendChild(createEl('p', 'spotlight-bio text-xs text-secondary mt-1', spotlight.bio));

        const followBtn = createEl(
          'button',
          `btn btn-sm mt-2 ${spotlight.isFollowing ? 'btn-secondary' : 'btn-primary'}`,
          spotlight.isFollowing ? 'Siguiendo ✓' : 'Conectar'
        );
        followBtn.onclick = () => {
          toggleFollowPartner(spotlight.id);
          renderDashboardView();
        };
        meta.appendChild(followBtn);

        row.appendChild(av);
        row.appendChild(meta);
        dashboardPartnerSpotlight.appendChild(row);
      }
    }

    updateHeaderAndSidebarUser();
  } catch (err) {
    console.error('Error in renderDashboardView:', err);
  }
}

// Quick Honduran Food Search
function initQuickFoodSearch() {
  if (!quickFoodSearch || !quickFoodResults) return;

  quickFoodSearch.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      quickFoodResults.textContent = '';
      return;
    }

    const matches = HONDURAN_FOOD_DATABASE.filter(f =>
      f.name.toLowerCase().includes(query)
    ).slice(0, 5);

    renderManualFoodSearchResults(quickFoodResults, matches, (item) => {
      const meal = {
        id: 'meal_' + Date.now(),
        timestamp: Date.now(),
        name: item.name,
        itemCount: item.portion,
        portion: item.portion,
        kcal: item.kcal,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        healthierPrep: 'Opción seleccionada de base de datos nutricional de Honduras.',
        whatToEatNext: 'Acompaña con agua fresca y vegetales verdes.'
      };
      addFoodLog(meal);
      quickFoodSearch.value = '';
      quickFoodResults.textContent = '';
      announce(`Agregado: ${item.name} a tu diario.`);
      renderDashboardView();
    });
  });
}

// Camera and File Upload Handlers
async function startCameraStream() {
  try {
    cameraLiveBox.classList.remove('hidden');
    await startWebcam(webcamVideo);
    isWebcamStreaming = true;
    announce('Cámara en vivo activada. Apunta a tu plato de comida.');
  } catch (err) {
    alert('No se pudo acceder a la cámara: ' + err.message);
  }
}

function stopCameraStream() {
  stopWebcam(webcamVideo);
  cameraLiveBox.classList.add('hidden');
  isWebcamStreaming = false;
}

async function handleSelectedFile(file) {
  if (!file) return;

  if (!file.type.match(/^image\/(jpeg|png|webp)$/i)) {
    alert('Formato no soportado. Seleccione una imagen JPEG, PNG o WebP.');
    return;
  }

  currentFile = file;
  scanPreviewPanel.classList.remove('hidden');
  scanPreviewName.textContent = file.name || 'Captura de cámara';
  scanPreviewDims.textContent = 'Optimizando resolución...';
  runAiScanBtn.disabled = true;

  try {
    const processed = await processAndResizeImage(file, 1024, 0.8);
    currentResizedBlob = processed.blob;
    currentThumbnail = await createThumbnail(file, 128);

    const objectUrl = URL.createObjectURL(processed.blob);
    scanPreviewImg.src = objectUrl;
    scanPreviewDims.textContent = `${processed.width} × ${processed.height} px • ${(processed.compressedSize / 1024).toFixed(1)} KB`;
    runAiScanBtn.disabled = false;
    announce('Imagen procesada y lista para escaneo con Gemini.');
  } catch (err) {
    scanPreviewDims.textContent = 'Error al procesar imagen';
    alert('No se pudo procesar la imagen: ' + err.message);
  }
}

async function runAiScan() {
  if (!currentResizedBlob) {
    alert('Por favor selecciona o toma una foto primero.');
    return;
  }

  scanLoadingState.classList.remove('hidden');
  scanResultsContainer.textContent = '';
  runAiScanBtn.disabled = true;
  announce('Analizando comida con Gemini 3.8 Flash...');

  try {
    const { analysis } = await analyzeFoodImage(currentResizedBlob);
    scanLoadingState.classList.add('hidden');
    runAiScanBtn.disabled = false;

    if (!analysis.isFood) {
      const notFoodCard = createEl('div', 'glass-card border-amber text-center p-4 mt-4');
      notFoodCard.appendChild(createEl('h3', 'text-amber font-bold', '⚠️ No se detectó un alimento comestible'));
      notFoodCard.appendChild(createEl('p', 'text-muted mt-2', analysis.foodName || 'La imagen no corresponde a un platillo identificable. Por favor toma una foto enfocada del alimento.'));
      scanResultsContainer.appendChild(notFoodCard);
      announce('La imagen no corresponde a un alimento.');
      return;
    }

    renderFoodScanResult(
      scanResultsContainer,
      analysis,
      (mealPayload) => {
        addFoodLog(mealPayload);
        announce(`${mealPayload.name} agregada exitosamente al diario de hoy.`);
        switchView('dashboard');
      },
      currentThumbnail
    );

    announce(`Análisis completado: ${analysis.foodName}`);
    scanResultsContainer.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    scanLoadingState.classList.add('hidden');
    runAiScanBtn.disabled = false;
    const errCard = createEl('div', 'glass-card border-rose text-center p-4 mt-4');
    errCard.appendChild(createEl('h3', 'text-rose font-bold', 'Error en el Análisis'));
    errCard.appendChild(createEl('p', 'text-muted mt-2', err.message || 'Error desconocido al procesar con IA.'));
    scanResultsContainer.appendChild(errCard);
    announce('Error en el análisis de comida.');
  }
}

/* ==========================================================================
   MODULE 4: AI TRAINER
   ========================================================================== */

function renderTrainerView() {
  const routine = getActiveRoutine();
  const activeGym = getActiveGym();

  renderRoutineView(
    routineContainer,
    routine,
    (exerciseName, setNum, isCompleted) => {
      announce(`Serie ${setNum} de ${exerciseName} marcada como ${isCompleted ? 'completada' : 'pendiente'}.`);
    },
    activeGym
  );
}

async function handleGenerateAiRoutine() {
  const profile = getProfile();
  const activeGym = getActiveGym();

  if (!generateAiRoutineBtn) return;
  generateAiRoutineBtn.disabled = true;
  generateAiRoutineBtn.textContent = 'Entrenador pensando...';

  const loadingCard = createEl('div', 'glass-card text-center p-5');
  loadingCard.appendChild(createEl('div', 'spinner mb-3'));
  loadingCard.appendChild(createEl('h3', 'neon-title-lime', 'Diseñando Rutina Semanal Personalizada...'));
  loadingCard.appendChild(createEl('p', 'text-muted mt-1', `Adaptando selección biomecánica a las máquinas de ${activeGym.name}...`));
  routineContainer.textContent = '';
  routineContainer.appendChild(loadingCard);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const routine = await generateWorkoutRoutine({
      goal: profile.goal,
      days: 4,
      experience: profile.experience,
      injuries: profile.injuries || 'Ninguna',
      equipment: activeGym.equipment || []
    }, { signal: controller.signal });
    clearTimeout(timeoutId);

    saveActiveRoutine(routine);
    renderTrainerView();
    announce(`Nueva rutina generada con éxito: ${routine.splitName}`);
  } catch (err) {
    clearTimeout(timeoutId);
    routineContainer.textContent = '';

    const errorCard = createEl('div', 'glass-card text-center p-5');
    errorCard.appendChild(createEl('h3', 'section-subheading mb-2 text-danger', '⚠️ No se pudo generar la rutina'));

    const isTimeout = err?.name === 'AbortError' || err?.code === 'TIMEOUT' || err?.status === 408;
    const msg = isTimeout
      ? 'La solicitud superó el límite de 30 segundos de espera.'
      : (err?.message || 'Ocurrió un error al contactar al Entrenador IA.');
    errorCard.appendChild(createEl('p', 'text-muted mb-4', msg));

    const retryBtn = createEl('button', 'btn btn-primary', '↻ Reintentar');
    retryBtn.type = 'button';
    retryBtn.onclick = () => handleGenerateAiRoutine();
    errorCard.appendChild(retryBtn);

    routineContainer.appendChild(errorCard);
  } finally {
    clearTimeout(timeoutId);
    generateAiRoutineBtn.disabled = false;
    generateAiRoutineBtn.textContent = '';
    const bolt = createEl('span', '', '⚡ ');
    bolt.setAttribute('aria-hidden', 'true');
    generateAiRoutineBtn.appendChild(bolt);
    generateAiRoutineBtn.appendChild(document.createTextNode('Regenerar Rutina con IA'));
  }
}

/* ==========================================================================
   MODULE 5: GYMS & EQUIPMENT
   ========================================================================== */

function renderGymsViewModule() {
  const gyms = getGyms();
  const activeGym = getActiveGym();

  renderGymsView(
    gymsContainer,
    gyms,
    activeGym.id,
    (selectedGymId) => {
      setActiveGymId(selectedGymId);
      updateHeaderAndSidebarUser();
      renderGymsViewModule();
      announce('Gimnasio activo actualizado.');
    },
    (newGym) => {
      saveGym(newGym);
      setActiveGymId(newGym.id);
      updateHeaderAndSidebarUser();
      renderGymsViewModule();
      announce(`Nuevo gimnasio guardado: ${newGym.name}`);
    }
  );
}

/* ==========================================================================
   MODULE 3: SUPPLEMENTS ADVISOR
   ========================================================================== */

function renderSupplementsViewModule() {
  const savedData = getSavedSupplements();

  renderSupplementsView(supplementsContainer, savedData, async () => {
    const profile = getProfile();
    const consumed = getDailyTotals();
    const targets = profile.targets;

    supplementsContainer.textContent = '';
    const loadingCard = createEl('div', 'glass-card text-center p-5');
    loadingCard.appendChild(createEl('div', 'spinner mb-3'));
    loadingCard.appendChild(createEl('h3', 'neon-title-violet', 'Calculando Brechas Nutricionales...'));
    loadingCard.appendChild(createEl('p', 'text-muted mt-1', 'Evaluando evidencia clínica para micronutrientes y suplementos ergogénicos...'));
    supplementsContainer.appendChild(loadingCard);

    try {
      const advice = await getSupplementsAdvice({
        goal: profile.goal,
        experience: profile.experience,
        currentProteinGrams: Math.round(consumed.protein),
        targetProteinGrams: Math.round(targets.targetProtein),
        caloriesDeficitOrSurplus: (consumed.kcal < targets.targetCalories - 200) ? 'déficit' : ((consumed.kcal > targets.targetCalories + 200) ? 'superávit' : 'mantenimiento'),
        dietaryRestrictions: profile.dietRestrictions || 'Ninguna'
      });

      saveSupplements(advice);
      renderSupplementsViewModule();
      announce('Evaluación de suplementación completada.');
    } catch (err) {
      alert('Error al consultar asesor de suplementos: ' + err.message);
      renderSupplementsViewModule();
    }
  });
}

/* ==========================================================================
   MODULE 6: SOCIAL (GYMPARTNERS)
   ========================================================================== */

function renderSocialViewModule() {
  const posts = getSocialPosts();
  const partners = getPartners();
  const profile = getProfile();

  renderSocialView(
    socialContainer,
    posts,
    partners,
    (postId) => {
      togglePostLike(postId);
      renderSocialViewModule();
    },
    (postId, commentText) => {
      addPostComment(postId, commentText, profile.name);
      renderSocialViewModule();
    },
    (postData) => {
      const activeGym = getActiveGym();
      const newPost = {
        id: 'post_' + Date.now(),
        authorId: 'user_current',
        authorName: profile.name,
        authorUsername: profile.username,
        authorAvatar: profile.avatar || '⚡',
        gym: activeGym.name,
        timestamp: Date.now(),
        type: 'workout',
        title: postData.title,
        content: postData.content,
        stats: { racha: `${profile.streak} días`, gym: activeGym.city },
        likes: 0,
        hasLiked: false,
        comments: []
      };
      addSocialPost(newPost);
      renderSocialViewModule();
      announce('Publicación compartida con la comunidad GymPartners.');
    },
    (partnerId) => {
      toggleFollowPartner(partnerId);
      renderSocialViewModule();
    }
  );
}

/* ==========================================================================
   MODULE 1: PROFILE & ONBOARDING
   ========================================================================== */

function renderProfileViewModule() {
  const profile = getProfile();

  renderProfileView(profileContainer, profile, (updatedProfile) => {
    saveProfile(updatedProfile);
    updateHeaderAndSidebarUser();
    renderProfileViewModule();
    announce('Perfil de atleta guardado exitosamente. Metas y somatotipo actualizados.');
    alert('¡Perfil actualizado con éxito! Tus metas y recomendaciones calóricas fueron recalculadas.');
  });
}

/* ==========================================================================
   EVENT LISTENERS INITIALIZATION
   ========================================================================== */

function initEventListeners() {
  // Desktop Sidebar Navigation Click
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-view');
      if (target) switchView(target);
    });
  });

  // Mobile Bottom Navigation Click
  document.querySelectorAll('.bottom-nav-mobile .bottom-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-view');
      if (target) switchView(target);
    });
  });

  // Header Gym pill quick click
  if (topActiveGymPill) {
    topActiveGymPill.addEventListener('click', () => switchView('gyms'));
  }

  // Dashboard shortcuts
  if (quickScanBtn) {
    quickScanBtn.addEventListener('click', () => switchView('scanner'));
  }
  if (gotoTrainerBtn) {
    gotoTrainerBtn.addEventListener('click', () => switchView('trainer'));
  }
  if (gotoSocialBtn) {
    gotoSocialBtn.addEventListener('click', () => switchView('social'));
  }

  // Scanner Camera Events
  if (startWebcamBtn) {
    startWebcamBtn.addEventListener('click', startCameraStream);
  }
  if (closeCameraBtn) {
    closeCameraBtn.addEventListener('click', stopCameraStream);
  }
  if (captureSnapshotBtn) {
    captureSnapshotBtn.addEventListener('click', async () => {
      try {
        const frame = await captureWebcamFrame(webcamVideo);
        stopCameraStream();
        await handleSelectedFile(frame);
      } catch (err) {
        alert('Error al capturar cuadro de cámara: ' + err.message);
      }
    });
  }

  // File Inputs
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleSelectedFile(e.target.files[0]);
      }
    });
  }
  if (cameraDirectInput) {
    cameraDirectInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleSelectedFile(e.target.files[0]);
      }
    });
  }

  // Drag & drop dropzone
  if (dropzone) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        handleSelectedFile(dt.files[0]);
      }
    });

    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (fileInput) fileInput.click();
      }
    });
  }

  // Scanner Run Button
  if (runAiScanBtn) {
    runAiScanBtn.addEventListener('click', runAiScan);
  }

  // Trainer AI Button
  if (generateAiRoutineBtn) {
    generateAiRoutineBtn.addEventListener('click', handleGenerateAiRoutine);
  }

  // Honduran Quick Food Search
  initQuickFoodSearch();
}

function initAuthFlow() {
  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      const user = getCurrentUser();
      if (user) {
        if (confirm('¿Deseas cerrar tu sesión en FitMate?')) {
          await signOutUser();
          sessionStorage.removeItem('fitmate_guest_mode');
          if (authOverlay) authOverlay.classList.remove('hidden');
          updateHeaderAndSidebarUser();
          announce('Sesión cerrada.');
        }
      } else {
        if (authOverlay) authOverlay.classList.remove('hidden');
      }
    });
  }

  if (guestContinueBtn) {
    guestContinueBtn.addEventListener('click', () => {
      sessionStorage.setItem('fitmate_guest_mode', 'true');
      if (authOverlay) authOverlay.classList.add('hidden');
      announce('Modo offline / invitado activo.');
    });
  }

  if (googleSigninBtn) {
    googleSigninBtn.addEventListener('click', async () => {
      if (authErrorMsg) {
        authErrorMsg.textContent = '';
        authErrorMsg.classList.add('hidden');
      }

      if (!isFirebaseConfigured()) {
        if (authErrorMsg) {
          authErrorMsg.textContent = 'Configura las credenciales de tu proyecto Firebase en src/public/config.js para habilitar Google Sign-in. Mientras tanto, puedes usar el Modo Offline (Invitado).';
          authErrorMsg.classList.remove('hidden');
        }
        return;
      }

      const originalHtml = googleSigninBtn.innerHTML;
      googleSigninBtn.disabled = true;
      googleSigninBtn.textContent = 'Conectando con Google...';

      try {
        const user = await signInWithGoogle();
        if (user) {
          await syncUserStorageWithFirestore(user.uid);
          if (authOverlay) authOverlay.classList.add('hidden');
          updateHeaderAndSidebarUser();
          switchView(currentView);
          announce(`Bienvenido, ${user.displayName || 'Atleta'}. Sincronización en la nube activa.`);
        }
      } catch (err) {
        console.error('[FitMate Auth]', err);
        if (authErrorMsg) {
          authErrorMsg.textContent = err.message || 'Error al iniciar sesión con Google. Intenta nuevamente.';
          authErrorMsg.classList.remove('hidden');
        }
      } finally {
        googleSigninBtn.disabled = false;
        googleSigninBtn.innerHTML = originalHtml;
      }
    });
  }

  // Initialize Firebase Modular Auth
  initFirebase(async (user) => {
    if (user) {
      await syncUserStorageWithFirestore(user.uid);
      if (authOverlay) authOverlay.classList.add('hidden');
    } else {
      const isGuest = sessionStorage.getItem('fitmate_guest_mode') === 'true';
      if (!isGuest && authOverlay) {
        authOverlay.classList.remove('hidden');
      }
    }
    updateHeaderAndSidebarUser();
  });
}

// Bootstrap Application
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initEventListeners();
  initAuthFlow();
  updateHeaderAndSidebarUser();
  switchView('dashboard');

  // Register PWA Service Worker for offline resilience
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[FitMate PWA] Service Worker registration failed:', err);
    });
  }

  // Mount Floating Audio Rest Timer Widget
  globalRestTimer.mountFloatingWidget(document.querySelector('.app-main-wrapper') || document.body);

  // Initialize Dynamic Pointer Spotlight for Glass Cards
  initSpotlightCards(document.querySelector('.app-layout') || document.body);
});
