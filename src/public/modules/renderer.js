/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import { globalRestTimer } from './GymRestTimer.js';
import { HONDURAS_ACHIEVEMENTS, getStreakFlameConfig } from './gamification.js';
import { getFoodLogs } from './storage.js';

export function createEl(tag, className = '', text = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== '') el.textContent = text;
  return el;
}

function createSvgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

export function formatNum(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('es-HN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

/**
 * Creates an animated neo-futuristic SVG circular progress ring
 */
export function createMacroRing(label, current, target, unit, colorClass, radius = 38) {
  const container = createEl('div', 'macro-ring-card');

  const ringWrap = createEl('div', 'macro-ring-wrap');
  const size = (radius * 2) + 16;
  const circumference = 2 * Math.PI * radius;
  const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const offset = circumference - (circumference * percent) / 100;

  const svg = createSvgEl('svg', {
    class: 'macro-ring-svg',
    width: String(size),
    height: String(size),
    viewBox: `0 0 ${size} ${size}`,
    role: 'progressbar',
    'aria-valuenow': String(percent),
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-label': `${label}: ${current} de ${target} ${unit}`
  });

  const bgCircle = createSvgEl('circle', {
    class: 'macro-ring-bg',
    cx: String(size / 2),
    cy: String(size / 2),
    r: String(radius)
  });

  const progressCircle = createSvgEl('circle', {
    class: `macro-ring-bar ${colorClass}`,
    cx: String(size / 2),
    cy: String(size / 2),
    r: String(radius),
    'stroke-dasharray': String(circumference),
    'stroke-dashoffset': String(offset)
  });

  svg.appendChild(bgCircle);
  svg.appendChild(progressCircle);
  ringWrap.appendChild(svg);

  const centerText = createEl('div', 'macro-ring-center');
  const percentEl = createEl('span', 'macro-ring-percent', `${percent}%`);
  centerText.appendChild(percentEl);
  ringWrap.appendChild(centerText);

  container.appendChild(ringWrap);

  const labelEl = createEl('div', 'macro-ring-label', label);
  const valuesEl = createEl('div', 'macro-ring-values');
  const curSpan = createEl('span', 'macro-ring-current', `${formatNum(current)}`);
  const slash = createEl('span', 'macro-ring-slash', ` / ${formatNum(target)} ${unit}`);
  valuesEl.appendChild(curSpan);
  valuesEl.appendChild(slash);

  container.appendChild(labelEl);
  container.appendChild(valuesEl);

  return container;
}

/**
 * Renders the top Dashboard Macro Rings & Coaching Verdict
 */
export function renderDashboardMacros(container, consumed, targets, verdict) {
  container.textContent = '';

  const grid = createEl('div', 'dashboard-macro-grid');
  grid.appendChild(createMacroRing('Calorías', consumed.kcal, targets.targetCalories, 'kcal', 'ring-cyan', 44));
  grid.appendChild(createMacroRing('Proteína', consumed.protein, targets.targetProtein, 'g', 'ring-violet', 38));
  grid.appendChild(createMacroRing('Carbohidratos', consumed.carbs, targets.targetCarbs, 'g', 'ring-lime', 38));
  grid.appendChild(createMacroRing('Grasas', consumed.fat, targets.targetFat, 'g', 'ring-amber', 38));
  container.appendChild(grid);

  // Verdict and Coach Tip Card
  const verdictCard = createEl('div', `glass-card verdict-card border-${verdict.color}`);
  const header = createEl('div', 'verdict-header');
  const badge = createEl('span', `badge badge-${verdict.color}`, verdict.badgeText);
  const title = createEl('h3', 'verdict-title', 'Diagnóstico de tu Coach de IA');
  header.appendChild(badge);
  header.appendChild(title);

  const tipText = createEl('p', 'verdict-tip', verdict.tip);

  const remainingBar = createEl('div', 'remaining-macros-bar');
  const remCal = createEl('span', 'rem-pill', `Restan: ${formatNum(Math.max(verdict.remainingKcal, 0))} kcal`);
  const remProt = createEl('span', 'rem-pill', `Proteína rest.: ${formatNum(Math.max(verdict.remainingProtein, 0))} g`);
  remainingBar.appendChild(remCal);
  remainingBar.appendChild(remProt);

  verdictCard.appendChild(header);
  verdictCard.appendChild(tipText);
  verdictCard.appendChild(remainingBar);
  container.appendChild(verdictCard);
}

/**
 * Renders the Daily Meals Log in Dashboard
 */
export function renderMealLogList(container, logs, onDeleteMeal) {
  container.textContent = '';

  if (logs.length === 0) {
    const empty = createEl('p', 'text-muted italic', 'No has registrado alimentos hoy. Escanea tu plato o búscalo abajo.');
    container.appendChild(empty);
    return;
  }

  const list = createEl('div', 'meal-log-list');
  for (const meal of logs) {
    const item = createEl('div', 'meal-log-item glass-card');

    const mainInfo = createEl('div', 'meal-info');
    const name = createEl('h4', 'meal-name', meal.name);
    const meta = createEl('div', 'meal-meta', `${meal.itemCount || meal.portion} • ${new Date(meal.timestamp).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}`);
    mainInfo.appendChild(name);
    mainInfo.appendChild(meta);

    const macros = createEl('div', 'meal-macros-chips');
    macros.appendChild(createEl('span', 'chip chip-cal', `${formatNum(meal.kcal)} kcal`));
    macros.appendChild(createEl('span', 'chip chip-prot', `${formatNum(meal.protein)}g P`));
    macros.appendChild(createEl('span', 'chip chip-carbs', `${formatNum(meal.carbs)}g C`));
    macros.appendChild(createEl('span', 'chip chip-fat', `${formatNum(meal.fat)}g G`));

    const deleteBtn = createEl('button', 'btn-icon-danger', '✕');
    deleteBtn.setAttribute('aria-label', `Eliminar ${meal.name}`);
    deleteBtn.onclick = () => onDeleteMeal(meal.id);

    item.appendChild(mainInfo);
    item.appendChild(macros);
    item.appendChild(deleteBtn);
    list.appendChild(item);
  }

  container.appendChild(list);
}

/**
 * Renders the Food Scanner AI Result with item counting and editable inputs
 */
export function renderFoodScanResult(container, analysis, onAddToLog, currentThumbnail) {
  container.textContent = '';

  const card = createEl('div', 'glass-card scan-result-card');

  const topRow = createEl('div', 'scan-top-row');
  if (currentThumbnail) {
    const img = createEl('img', 'scan-thumb');
    img.src = currentThumbnail;
    img.alt = analysis.foodName || 'Alimento';
    topRow.appendChild(img);
  }

  const titleWrap = createEl('div', 'scan-title-wrap');
  const title = createEl('h3', 'neon-title-cyan', analysis.foodName || 'Alimento Escaneado');
  const countBadge = createEl('span', 'badge badge-cyan', `Conteo: ${analysis.itemCount || '1 porción'}`);
  const portionMeta = createEl('p', 'scan-portion-meta', analysis.portionDescription || 'Porción estimada');
  titleWrap.appendChild(title);
  titleWrap.appendChild(countBadge);
  titleWrap.appendChild(portionMeta);
  topRow.appendChild(titleWrap);
  card.appendChild(topRow);

  // Editable macros form
  const editSection = createEl('div', 'scan-edit-section');
  const editTitle = createEl('h4', 'section-subheading', 'Valores para el total del plato (Editables):');
  editSection.appendChild(editTitle);

  const inputsGrid = createEl('div', 'inputs-grid');

  const portion = analysis.totalPortionEstimate || analysis.macronutrients || {};
  const kcalInput = createInputField('Calorías (kcal)', 'input-kcal', portion.kcal || 350, 'number');
  const protInput = createInputField('Proteína (g)', 'input-prot', portion.protein || 20, 'number');
  const carbsInput = createInputField('Carbohidratos (g)', 'input-carbs', portion.carbs || 40, 'number');
  const fatInput = createInputField('Grasas (g)', 'input-fat', portion.fat || 10, 'number');
  const fiberInput = createInputField('Fibra (g)', 'input-fiber', portion.fiber || 5, 'number');

  inputsGrid.appendChild(kcalInput.wrapper);
  inputsGrid.appendChild(protInput.wrapper);
  inputsGrid.appendChild(carbsInput.wrapper);
  inputsGrid.appendChild(fatInput.wrapper);
  inputsGrid.appendChild(fiberInput.wrapper);
  editSection.appendChild(inputsGrid);
  card.appendChild(editSection);

  // Healthier Prep & What to Eat Next cards
  if (analysis.healthierPrep) {
    const prepCard = createEl('div', 'tip-subcard border-lime');
    const pTitle = createEl('h5', 'tip-subcard-title text-lime', '💡 Preparación Más Saludable (Nutrición Deportiva):');
    const pText = createEl('p', 'tip-subcard-text', analysis.healthierPrep);
    prepCard.appendChild(pTitle);
    prepCard.appendChild(pText);
    card.appendChild(prepCard);
  }

  if (analysis.whatToEatNext) {
    const nextCard = createEl('div', 'tip-subcard border-violet');
    const nTitle = createEl('h5', 'tip-subcard-title text-violet', '🥑 Qué Comer en tu Próxima Comida (Alimentos de Honduras):');
    const nText = createEl('p', 'tip-subcard-text', analysis.whatToEatNext);
    nextCard.appendChild(nTitle);
    nextCard.appendChild(nText);
    card.appendChild(nextCard);
  }

  // Action Button
  const addBtn = createEl('button', 'btn btn-primary btn-glow mt-4', '➕ Agregar al Diario de Hoy');
  addBtn.onclick = () => {
    const payload = {
      id: 'meal_' + Date.now(),
      timestamp: Date.now(),
      name: analysis.foodName || 'Comida escaneada',
      itemCount: analysis.itemCount || '1 porción',
      portion: analysis.portionDescription || 'Porción en plato',
      kcal: parseFloat(kcalInput.input.value) || 0,
      protein: parseFloat(protInput.input.value) || 0,
      carbs: parseFloat(carbsInput.input.value) || 0,
      fat: parseFloat(fatInput.input.value) || 0,
      fiber: parseFloat(fiberInput.input.value) || 0,
      healthierPrep: analysis.healthierPrep,
      whatToEatNext: analysis.whatToEatNext
    };
    onAddToLog(payload);
  };

  card.appendChild(addBtn);
  card.appendChild(createEl('div', 'disclaimer-note mt-3', 'Orientación general, no sustituye a un profesional.'));
  container.appendChild(card);
}

function createInputField(label, id, value, type = 'text') {
  const wrapper = createEl('div', 'form-field');
  const lbl = createEl('label', 'field-label', label);
  lbl.setAttribute('for', id);
  const input = createEl('input', 'field-input');
  input.id = id;
  input.type = type;
  input.value = String(value);
  wrapper.appendChild(lbl);
  wrapper.appendChild(input);
  return { wrapper, input };
}

/**
 * Renders manual food search matches
 */
export function renderManualFoodSearchResults(container, results, onSelect) {
  container.textContent = '';
  if (results.length === 0) {
    container.appendChild(createEl('p', 'text-muted italic', 'No se encontraron alimentos en la base de datos local.'));
    return;
  }

  const list = createEl('div', 'manual-food-list');
  for (const item of results) {
    const row = createEl('div', 'manual-food-row glass-card');

    const info = createEl('div', 'manual-food-info');
    info.appendChild(createEl('h5', 'manual-food-title', item.name));
    info.appendChild(createEl('span', 'manual-food-portion', `${item.portion} • ${item.kcal} kcal | ${item.protein}g P | ${item.carbs}g C | ${item.fat}g G`));

    const btn = createEl('button', 'btn btn-secondary btn-sm', '+ Añadir');
    btn.onclick = () => onSelect(item);

    row.appendChild(info);
    row.appendChild(btn);
    list.appendChild(row);
  }
  container.appendChild(list);
}

/**
 * Renders AI Trainer Routine & Interactive Workout Logger
 */
export function renderRoutineView(container, routine, onLogSet, activeGym) {
  container.textContent = '';

  const headerCard = createEl('div', 'glass-card mb-4');
  const badge = createEl('span', 'badge badge-lime', 'Planificado por Entrenador de IA');
  const title = createEl('h2', 'neon-title-lime mt-1', routine.splitName);
  const gymMeta = createEl('p', 'text-muted', `Adaptado a: ${activeGym ? activeGym.name : 'Gimnasio Actual'} (${activeGym ? activeGym.city : 'Tegucigalpa'})`);
  const overview = createEl('p', 'routine-overview mt-2', routine.overview);

  headerCard.appendChild(badge);
  headerCard.appendChild(title);
  headerCard.appendChild(gymMeta);
  headerCard.appendChild(overview);
  headerCard.appendChild(createEl('div', 'disclaimer-note mt-2', 'Orientación general, no sustituye a un profesional.'));
  container.appendChild(headerCard);

  // Schedule Days
  const daysContainer = createEl('div', 'routine-days-stack');

  routine.schedule.forEach((day, dayIndex) => {
    const dayCard = createEl('div', 'glass-card day-card mb-4');

    const dayHead = createEl('div', 'day-header');
    const dayTitle = createEl('h3', 'day-title', day.dayName);
    const dayFocus = createEl('span', 'badge badge-violet', day.focus);
    dayHead.appendChild(dayTitle);
    dayHead.appendChild(dayFocus);
    dayCard.appendChild(dayHead);

    const exList = createEl('div', 'exercise-list mt-3');

    day.exercises.forEach((ex, exIndex) => {
      const exCard = createEl('div', 'exercise-card');

      const exHead = createEl('div', 'exercise-head');
      const exName = createEl('h4', 'exercise-name', `${exIndex + 1}. ${ex.name}`);
      const machineBadge = createEl('span', 'chip chip-machine', ex.machine);
      exHead.appendChild(exName);
      exHead.appendChild(machineBadge);
      exCard.appendChild(exHead);

      const targetBar = createEl('div', 'exercise-targets');
      targetBar.appendChild(createEl('span', 'target-tag', `Series: ${ex.sets}`));
      targetBar.appendChild(createEl('span', 'target-tag', `Reps: ${ex.reps}`));
      targetBar.appendChild(createEl('span', 'target-tag', `Descanso: ${ex.restSec}s`));
      targetBar.appendChild(createEl('span', 'target-tag text-cyan', `Carga sug.: ${ex.startingWeight}`));
      exCard.appendChild(targetBar);

      const rulesBox = createEl('div', 'exercise-rules');
      rulesBox.appendChild(createEl('p', 'rule-overload', `📈 Sobrecarga: ${ex.overloadRule}`));
      rulesBox.appendChild(createEl('p', 'rule-form', `🎯 Clave técnica: ${ex.formCue}`));
      exCard.appendChild(rulesBox);

      // Interactive set logger
      const loggerWrap = createEl('div', 'set-logger');
      const loggerLabel = createEl('div', 'logger-label', 'Registro de series completadas hoy:');
      loggerWrap.appendChild(loggerLabel);

      const setsRow = createEl('div', 'sets-row');
      for (let s = 1; s <= ex.sets; s++) {
        const setChip = createEl('label', 'set-checkbox-label');
        const chk = createEl('input', 'set-checkbox');
        chk.type = 'checkbox';
        chk.onchange = () => {
          setChip.classList.toggle('set-completed', chk.checked);
          if (chk.checked) {
            globalRestTimer.start(ex.restSec || 90);
          }
          onLogSet(ex.name, s, chk.checked);
        };
        const sNum = createEl('span', 'set-num', `S${s}`);
        setChip.appendChild(chk);
        setChip.appendChild(sNum);
        setsRow.appendChild(setChip);
      }
      loggerWrap.appendChild(setsRow);
      exCard.appendChild(loggerWrap);

      exList.appendChild(exCard);
    });

    dayCard.appendChild(exList);
    daysContainer.appendChild(dayCard);
  });

  container.appendChild(daysContainer);
}

/**
 * Renders Gym Selector & Creator
 */
export function renderGymsView(container, gyms, activeGymId, onSelectGym, onAddCustomGym) {
  container.textContent = '';

  const header = createEl('div', 'gyms-header mb-4');
  header.appendChild(createEl('h2', 'neon-title-cyan', 'Gimnasios y Equipamiento'));
  header.appendChild(createEl('p', 'text-muted', 'Selecciona tu gimnasio en Honduras o crea uno personalizado con las máquinas que dispones para que las rutinas de IA se adapten al 100%.'));
  container.appendChild(header);

  const gymsGrid = createEl('div', 'gyms-grid');
  for (const gym of gyms) {
    const isCurrent = gym.id === activeGymId;
    const card = createEl('div', `glass-card gym-card ${isCurrent ? 'gym-card-active' : ''}`);

    const top = createEl('div', 'gym-top');
    const name = createEl('h3', 'gym-name', gym.name);
    top.appendChild(name);
    if (isCurrent) {
      top.appendChild(createEl('span', 'badge badge-lime', 'GIMNASIO ACTIVO'));
    }
    card.appendChild(top);

    card.appendChild(createEl('p', 'gym-address text-muted', `📍 ${gym.city} — ${gym.address}`));

    const eqTitle = createEl('h5', 'gym-eq-title mt-2', `Equipamiento disponible (${gym.equipment.length} items):`);
    card.appendChild(eqTitle);

    const chips = createEl('div', 'chips-container mt-1');
    for (const eq of gym.equipment.slice(0, 6)) {
      chips.appendChild(createEl('span', 'chip', eq));
    }
    if (gym.equipment.length > 6) {
      chips.appendChild(createEl('span', 'chip chip-muted', `+${gym.equipment.length - 6} más`));
    }
    card.appendChild(chips);

    if (!isCurrent) {
      const selectBtn = createEl('button', 'btn btn-secondary btn-sm mt-3 w-100', 'Entrenar en este Gym');
      selectBtn.onclick = () => onSelectGym(gym.id);
      card.appendChild(selectBtn);
    }

    gymsGrid.appendChild(card);
  }
  container.appendChild(gymsGrid);

  // Custom Gym Form
  const formCard = createEl('div', 'glass-card mt-5');
  formCard.appendChild(createEl('h3', 'section-subheading', '➕ Agregar Nuevo Gimnasio / Home Gym'));

  const nameInput = createInputField('Nombre del Gimnasio', 'custom-gym-name', '', 'text');
  const cityInput = createInputField('Ciudad (ej. Tegucigalpa, SPS, Danlí)', 'custom-gym-city', 'Tegucigalpa', 'text');
  const addrInput = createInputField('Dirección o Zona', 'custom-gym-addr', '', 'text');

  formCard.appendChild(nameInput.wrapper);
  formCard.appendChild(cityInput.wrapper);
  formCard.appendChild(addrInput.wrapper);

  const addGymBtn = createEl('button', 'btn btn-primary mt-3', 'Guardar Gimnasio');
  addGymBtn.onclick = () => {
    const gName = nameInput.input.value.trim();
    if (!gName) {
      alert('Por favor escribe el nombre del gimnasio.');
      return;
    }
    onAddCustomGym({
      id: 'gym_' + Date.now(),
      name: gName,
      city: cityInput.input.value.trim() || 'Tegucigalpa',
      address: addrInput.input.value.trim() || 'Dirección local',
      equipment: [
        'Mancuernas (Dumbbells)',
        'Barra Olímpica y Discos',
        'Banco Plano y Reclinable',
        'Prensa de Piernas (Leg Press)',
        'Poleas Ajustables (Cable Crossover)'
      ]
    });
  };
  formCard.appendChild(addGymBtn);
  container.appendChild(formCard);
}

/**
 * Renders Supplements Advisor View
 */
export function renderSupplementsView(container, data, onRequestAdvice) {
  container.textContent = '';

  const head = createEl('div', 'supps-header mb-4');
  head.appendChild(createEl('h2', 'neon-title-violet', 'Asesor de Suplementación Basado en Evidencia'));
  head.appendChild(createEl('p', 'text-muted', 'Análisis inteligente entre tu consumo real de comida hoy, tus requerimientos de fuerza y tu objetivo físico.'));
  head.appendChild(createEl('div', 'disclaimer-note mt-2', 'Orientación general, no sustituye a un profesional.'));
  container.appendChild(head);

  if (!data) {
    const emptyBox = createEl('div', 'glass-card text-center p-5');
    emptyBox.appendChild(createEl('p', 'text-muted mb-3', 'Aún no has generado una evaluación de suplementos para tu día actual.'));
    const genBtn = createEl('button', 'btn btn-primary btn-glow', '💊 Analizar Brechas y Recomendar Suplementos');
    genBtn.onclick = onRequestAdvice;
    emptyBox.appendChild(genBtn);
    container.appendChild(emptyBox);
    return;
  }

  // Verdict Summary
  const diagCard = createEl('div', 'glass-card border-violet mb-4');
  diagCard.appendChild(createEl('h3', 'verdict-title text-violet', 'Diagnóstico Nutricional'));
  diagCard.appendChild(createEl('p', 'verdict-tip mt-1', data.summaryVerdict));
  container.appendChild(diagCard);

  // Supplements list
  const list = createEl('div', 'supplements-grid');
  for (const s of data.supplements) {
    let statusClass = 'badge-lime';
    if (s.status === 'Opcional') statusClass = 'badge-cyan';
    if (s.status === 'No necesario') statusClass = 'badge-amber';

    const card = createEl('div', 'glass-card supp-card');
    const top = createEl('div', 'supp-top');
    top.appendChild(createEl('h4', 'supp-name', s.name));
    top.appendChild(createEl('span', `badge ${statusClass}`, s.status.toUpperCase()));
    card.appendChild(top);

    card.appendChild(createEl('p', 'supp-dose', `📏 Dosis: ${s.dose}`));
    card.appendChild(createEl('p', 'supp-timing text-cyan', `⏰ Momento: ${s.timing}`));
    card.appendChild(createEl('p', 'supp-rationale text-muted mt-2', s.rationale));

    list.appendChild(card);
  }
  container.appendChild(list);

  // Safety Disclaimer
  const disc = createEl('div', 'disclaimer-card mt-4');
  disc.appendChild(createEl('h4', 'disclaimer-title', 'Descargo de Seguridad y Salud'));
  disc.appendChild(createEl('p', 'disclaimer-body', data.safetyDisclaimer));
  container.appendChild(disc);
}

/**
 * Renders Social Community Feed & GymPartners Finder
 */
export function renderSocialView(container, posts, partners, onLike, onComment, onNewPost, onToggleFollow) {
  container.textContent = '';

  const header = createEl('div', 'social-header mb-4');
  header.appendChild(createEl('h2', 'neon-title-cyan', 'GymPartners Honduras'));
  header.appendChild(createEl('p', 'text-muted', 'Comunidad fitness de Tegucigalpa y SPS. Encuentra compañeros con tus mismos objetivos y comparte tus comidas y marcas.'));
  container.appendChild(header);

  // Post Creator Form
  const postBox = createEl('div', 'glass-card post-creator mb-4');
  postBox.appendChild(createEl('h3', 'section-subheading', 'Compartir con la Comunidad'));
  const titleInp = createInputField('Título de tu logro o comida', 'post-title-inp', '', 'text');
  const contentInp = createInputField('¿Cómo estuvo tu entrenamiento o qué comiste hoy?', 'post-content-inp', '', 'text');
  postBox.appendChild(titleInp.wrapper);
  postBox.appendChild(contentInp.wrapper);

  const postBtn = createEl('button', 'btn btn-primary btn-sm mt-3', 'Publicar Post');
  postBtn.onclick = () => {
    const t = titleInp.input.value.trim();
    const c = contentInp.input.value.trim();
    if (!t || !c) {
      alert('Por favor escribe un título y contenido para tu publicación.');
      return;
    }
    onNewPost({ title: t, content: c });
    titleInp.input.value = '';
    contentInp.input.value = '';
  };
  postBox.appendChild(postBtn);
  container.appendChild(postBox);

  // Partner Finder Highlights
  const partnersSection = createEl('div', 'partners-section mb-5');
  partnersSection.appendChild(createEl('h3', 'section-subheading mb-3', '🤝 Atletas Entrenando Cerca de Ti'));

  const partnersGrid = createEl('div', 'partners-grid');
  for (const p of partners) {
    const pCard = createEl('div', 'glass-card partner-card');

    const pTop = createEl('div', 'partner-top');
    pTop.appendChild(createEl('div', 'partner-avatar', p.avatar));
    const pMeta = createEl('div', 'partner-meta');
    pMeta.appendChild(createEl('h4', 'partner-name', p.name));
    pMeta.appendChild(createEl('span', 'partner-user', p.username));
    pTop.appendChild(pMeta);
    pCard.appendChild(pTop);

    pCard.appendChild(createEl('p', 'partner-gym', `📍 ${p.gym}`));
    pCard.appendChild(createEl('span', 'badge badge-violet', p.goalLabel));
    pCard.appendChild(createEl('p', 'partner-bio mt-2 text-muted', p.bio));

    const prsRow = createEl('div', 'partner-prs mt-2');
    prsRow.appendChild(createEl('span', 'chip chip-cal', `Banca: ${p.prs.bench}`));
    prsRow.appendChild(createEl('span', 'chip chip-prot', `Sentadilla: ${p.prs.squat}`));
    prsRow.appendChild(createEl('span', 'chip chip-carbs', `Muerto: ${p.prs.deadlift}`));
    pCard.appendChild(prsRow);

    const followBtn = createEl('button', `btn btn-sm mt-3 w-100 ${p.isFollowing ? 'btn-secondary' : 'btn-primary'}`, p.isFollowing ? 'Siguiendo ✓' : 'Seguir / GymPartner');
    followBtn.onclick = () => onToggleFollow(p.id);
    pCard.appendChild(followBtn);

    partnersGrid.appendChild(pCard);
  }
  partnersSection.appendChild(partnersGrid);
  container.appendChild(partnersSection);

  // Feed Posts
  const feedSection = createEl('div', 'feed-section');
  feedSection.appendChild(createEl('h3', 'section-subheading mb-3', '📰 Muro de Actividad'));

  const postsList = createEl('div', 'posts-list');
  for (const post of posts) {
    const pCard = createEl('div', 'glass-card post-card mb-3');

    const pHeader = createEl('div', 'post-header');
    const authorWrap = createEl('div', 'post-author-wrap');
    authorWrap.appendChild(createEl('span', 'post-avatar', post.authorAvatar || '💪'));
    const aMeta = createEl('div', 'author-meta');
    aMeta.appendChild(createEl('strong', 'author-name', post.authorName));
    aMeta.appendChild(createEl('span', 'author-sub text-muted', `${post.authorUsername} • ${post.gym || 'Tegucigalpa'}`));
    authorWrap.appendChild(aMeta);
    pHeader.appendChild(authorWrap);

    const typeBadge = createEl('span', `badge ${post.type === 'workout' ? 'badge-lime' : 'badge-cyan'}`, post.type === 'workout' ? 'ENTRENAMIENTO' : 'NUTRICIÓN');
    pHeader.appendChild(typeBadge);
    pCard.appendChild(pHeader);

    pCard.appendChild(createEl('h4', 'post-title mt-2', post.title));
    pCard.appendChild(createEl('p', 'post-content mt-1', post.content));

    if (post.stats) {
      const statsBar = createEl('div', 'post-stats-bar mt-2');
      for (const [k, v] of Object.entries(post.stats)) {
        statsBar.appendChild(createEl('span', 'chip', `${k}: ${v}`));
      }
      pCard.appendChild(statsBar);
    }

    // Like and Comments actions
    const footer = createEl('div', 'post-footer mt-3');
    const likeBtn = createEl('button', `btn-like ${post.hasLiked ? 'has-liked' : ''}`);
    likeBtn.textContent = `❤️ ${post.likes || 0} Likes`;
    likeBtn.onclick = () => onLike(post.id);
    footer.appendChild(likeBtn);

    pCard.appendChild(footer);

    // Comments section
    const commentsWrap = createEl('div', 'post-comments mt-2');
    if (post.comments && post.comments.length > 0) {
      for (const c of post.comments) {
        const cRow = createEl('div', 'comment-row');
        cRow.appendChild(createEl('strong', 'comment-author', `${c.author}: `));
        cRow.appendChild(createEl('span', 'comment-text', c.text));
        commentsWrap.appendChild(cRow);
      }
    }

    const cInput = createEl('input', 'comment-input');
    cInput.placeholder = 'Escribe un comentario o saludo de gym...';
    cInput.onkeydown = (e) => {
      if (e.key === 'Enter' && cInput.value.trim()) {
        onComment(post.id, cInput.value.trim());
        cInput.value = '';
      }
    };
    commentsWrap.appendChild(cInput);
    pCard.appendChild(commentsWrap);

    postsList.appendChild(pCard);
  }
  feedSection.appendChild(postsList);
  container.appendChild(feedSection);
}

/**
 * Renders Profile / Onboarding View with Body Type calculation
 */
export function renderProfileView(container, profile, onSave) {
  container.textContent = '';

  const card = createEl('div', 'glass-card profile-card');

  const head = createEl('div', 'profile-top mb-4');
  head.appendChild(createEl('div', 'profile-avatar-big', profile.avatar || '⚡'));
  const hMeta = createEl('div', 'profile-header-meta');
  hMeta.appendChild(createEl('h2', 'neon-title-cyan', profile.name));
  hMeta.appendChild(createEl('span', 'text-muted', `${profile.username} • ${profile.city}`));
  head.appendChild(hMeta);
  card.appendChild(head);

  // Body Type Estimation Card
  if (profile.bodyType) {
    const bt = profile.bodyType;
    const btCard = createEl('div', 'body-type-card mb-4 border-cyan');
    btCard.appendChild(createEl('span', 'badge badge-cyan', bt.title.toUpperCase()));
    btCard.appendChild(createEl('p', 'bt-explanation mt-1', bt.explanation));
    btCard.appendChild(createEl('p', 'bt-tip text-lime mt-1', `💡 Estrategia recomendada: ${bt.trainingTip}`));
    card.appendChild(btCard);
  }

  // Profile Form Fields
  const grid = createEl('div', 'profile-form-grid');

  const ageF = createInputField('Edad (años)', 'prof-age', profile.age, 'number');
  const weightF = createInputField('Peso Corporal (kg)', 'prof-weight', profile.weight, 'number');
  const heightF = createInputField('Estatura (cm)', 'prof-height', profile.height, 'number');

  grid.appendChild(ageF.wrapper);
  grid.appendChild(weightF.wrapper);
  grid.appendChild(heightF.wrapper);

  // Goal select
  const goalWrap = createEl('div', 'form-field');
  goalWrap.appendChild(createEl('label', 'field-label', 'Objetivo Fitness'));
  const goalSel = createEl('select', 'field-input');
  goalSel.id = 'prof-goal';
  [
    { val: 'cut', label: 'Definición (Pérdida de grasa / Corte)' },
    { val: 'bulk', label: 'Volumen (Ganancia muscular / Hipertrofia)' },
    { val: 'maintain', label: 'Mantenimiento y Rendimiento Funcional' }
  ].forEach(opt => {
    const o = createEl('option', '', opt.label);
    o.value = opt.val;
    if (profile.goal === opt.val) o.selected = true;
    goalSel.appendChild(o);
  });
  goalWrap.appendChild(goalSel);
  grid.appendChild(goalWrap);

  // Activity select
  const actWrap = createEl('div', 'form-field');
  actWrap.appendChild(createEl('label', 'field-label', 'Nivel de Actividad Diaria'));
  const actSel = createEl('select', 'field-input');
  actSel.id = 'prof-act';
  [
    { val: 'sedentary', label: 'Sedentario (Oficina / poco movimiento)' },
    { val: 'light', label: 'Ligero (1-2 entrenamientos/semana)' },
    { val: 'moderate', label: 'Moderado (3-5 entrenamientos/semana)' },
    { val: 'very_active', label: 'Muy activo (6-7 entrenamientos/semana)' },
    { val: 'athlete', label: 'Atleta de alto rendimiento (Doble sesión)' }
  ].forEach(opt => {
    const o = createEl('option', '', opt.label);
    o.value = opt.val;
    if (profile.activity === opt.val) o.selected = true;
    actSel.appendChild(o);
  });
  actWrap.appendChild(actSel);
  grid.appendChild(actWrap);

  // Experience select
  const expWrap = createEl('div', 'form-field');
  expWrap.appendChild(createEl('label', 'field-label', 'Experiencia en Levantamiento'));
  const expSel = createEl('select', 'field-input');
  expSel.id = 'prof-exp';
  [
    { val: 'principiante', label: 'Principiante (< 1 año)' },
    { val: 'intermedio', label: 'Intermedio (1-3 años)' },
    { val: 'avanzado', label: 'Avanzado (> 3 años)' }
  ].forEach(opt => {
    const o = createEl('option', '', opt.label);
    o.value = opt.val;
    if (profile.experience === opt.val) o.selected = true;
    expSel.appendChild(o);
  });
  expWrap.appendChild(expSel);
  grid.appendChild(expWrap);

  const injF = createInputField('Lesiones o molestias físicas', 'prof-inj', profile.injuries || 'Ninguna', 'text');
  const dietF = createInputField('Restricciones o alergias alimentarias', 'prof-diet', profile.dietRestrictions || 'Ninguna', 'text');

  grid.appendChild(injF.wrapper);
  grid.appendChild(dietF.wrapper);

  card.appendChild(grid);

  const saveBtn = createEl('button', 'btn btn-primary btn-glow mt-4', 'Guardar Perfil y Recalcular Metas');
  saveBtn.onclick = () => {
    const updated = {
      ...profile,
      age: parseInt(ageF.input.value, 10) || 24,
      weight: parseFloat(weightF.input.value) || 75,
      height: parseInt(heightF.input.value, 10) || 175,
      goal: goalSel.value,
      activity: actSel.value,
      experience: expSel.value,
      injuries: injF.input.value.trim() || 'Ninguna',
      dietRestrictions: dietF.input.value.trim() || 'Ninguna'
    };
    onSave(updated);
  };
  card.appendChild(saveBtn);
  container.appendChild(card);

  // Honduran Fitness Badges & Gamification Section
  const badgesCard = createEl('div', 'glass-card mt-4');
  badgesCard.appendChild(createEl('h3', 'section-subheading mb-3', '🏆 Medallas de Fuerza & Nutrición (Honduras)'));

  const badgesGrid = createEl('div', 'badges-grid');
  const foodLogs = getFoodLogs();
  for (const ach of HONDURAS_ACHIEVEMENTS) {
    const isUnlocked = (ach.id === 'rey_baleada_fitness' || ach.id === 'bromatologia_visionaria')
      ? ach.checkUnlock(foodLogs)
      : ach.checkUnlock(profile);
    const bItem = createEl('div', `badge-item ${isUnlocked ? '' : 'badge-locked'}`);
    const iconBox = createEl('div', 'badge-icon-box', ach.icon);
    const infoBox = createEl('div', 'badge-info');
    infoBox.appendChild(createEl('h4', 'badge-info-title', ach.title));
    infoBox.appendChild(createEl('p', 'badge-info-desc', ach.desc));

    if (isUnlocked) {
      infoBox.appendChild(createEl('span', 'badge badge-lime text-xs mt-1', 'DESBLOQUEADO ✓'));
    } else {
      infoBox.appendChild(createEl('span', 'badge badge-secondary text-xs mt-1', 'BLOQUEADO 🔒'));
    }

    bItem.appendChild(iconBox);
    bItem.appendChild(infoBox);
    badgesGrid.appendChild(bItem);
  }
  badgesCard.appendChild(badgesGrid);
  container.appendChild(badgesCard);
}
