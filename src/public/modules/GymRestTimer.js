/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * GymRestTimer - Native Web Audio API Synthesizer & Floating Widget Controller
 * Zero external MP3 files. Dual-harmonic acoustics + Haptic Vibration.
 */

export class GymRestTimer {
  constructor() {
    this.audioCtx = null;
    this.intervalId = null;
    this.remainingSeconds = 0;
    this.totalSeconds = 90;
    this.isPaused = false;
    this.onTick = null;
    this.onComplete = null;
    this._widgetEl = null;
    this._autoCloseTimeoutId = null;
  }

  _initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Synthesize an 880Hz warning cue beep (for 3s, 2s, 1s count)
   */
  playWarningTick() {
    try {
      this._initAudioContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // Note A5

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.09);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (e) {
      console.warn('[GymRestTimer] Warning sound synthesis failed:', e);
    }
  }

  /**
   * Synthesize a dual-harmonic rich bell chime on rest completion (C5 + C6)
   */
  playCompletionChime() {
    try {
      this._initAudioContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Harmonic 1: Fundamental C5 (523.25 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      // Harmonic 2: Octave C6 (1046.50 Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, now);
      gain2.gain.setValueAtTime(0.18, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 0.9);

      // Heavy gym tactile cadence: 140ms pulse, 80ms rest, 240ms confirmation pulse
      if (navigator.vibrate) {
        navigator.vibrate([140, 80, 240]);
      }
    } catch (e) {
      console.warn('[GymRestTimer] Chime sound synthesis failed:', e);
    }
  }

  start(seconds = 90) {
    this.stop();
    this.totalSeconds = Math.max(5, seconds);
    this.remainingSeconds = this.totalSeconds;
    this.isPaused = false;

    this._notify();
    this._renderWidgetUI();

    this.intervalId = setInterval(() => {
      if (this.isPaused) return;

      this.remainingSeconds--;

      if (this.remainingSeconds > 0 && this.remainingSeconds <= 3) {
        this.playWarningTick();
      }

      this._notify();
      this._updateWidgetDisplay();

      if (this.remainingSeconds <= 0) {
        this.stop();
        this.playCompletionChime();
        if (this.onComplete) this.onComplete();
        this._updateWidgetDisplay();
        this._autoCloseTimeoutId = setTimeout(() => {
          this.close();
        }, 2000);
      }
    }, 1000);
  }

  pause() {
    this.isPaused = !this.isPaused;
    this._updateWidgetDisplay();
  }

  adjustTime(deltaSeconds) {
    if (this._autoCloseTimeoutId) {
      clearTimeout(this._autoCloseTimeoutId);
      this._autoCloseTimeoutId = null;
    }
    const wasZero = this.remainingSeconds <= 0;
    this.remainingSeconds = Math.max(0, this.remainingSeconds + deltaSeconds);
    this.totalSeconds = Math.max(this.totalSeconds, this.remainingSeconds);
    if (wasZero && this.remainingSeconds > 0 && !this.intervalId) {
      this.start(this.remainingSeconds);
      return;
    }
    this._notify();
    this._updateWidgetDisplay();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this._autoCloseTimeoutId) {
      clearTimeout(this._autoCloseTimeoutId);
      this._autoCloseTimeoutId = null;
    }
    this.isPaused = false;
  }

  close() {
    this.stop();
    if (this._widgetEl) {
      this._widgetEl.classList.add('hidden');
    }
  }

  _notify() {
    if (this.onTick) {
      this.onTick(this.remainingSeconds, this.totalSeconds);
    }
  }

  /**
   * Mounts or attaches the floating rest timer widget to the DOM
   */
  mountFloatingWidget(container = document.body) {
    if (document.getElementById('floating-rest-timer-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'floating-rest-timer-widget';
    widget.className = 'floating-rest-widget glass-spotlight-card hidden';

    // Widget Header
    const head = document.createElement('div');
    head.className = 'rest-widget-head';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'rest-widget-title';
    titleWrap.textContent = '⏱️ Descanso Entre Series';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-icon-glass btn-sm';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Ocultar widget';
    closeBtn.onclick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.close();
    };

    head.appendChild(titleWrap);
    head.appendChild(closeBtn);
    widget.appendChild(head);

    // Timer display (tabular numbers)
    const displayWrap = document.createElement('div');
    displayWrap.className = 'rest-widget-display';

    const timeNum = document.createElement('span');
    timeNum.id = 'rest-widget-time-text';
    timeNum.className = 'rest-time-digits';
    timeNum.textContent = '01:30';

    displayWrap.appendChild(timeNum);
    widget.appendChild(displayWrap);

    // Controls (+30s, Pause/Resume, -30s)
    const controls = document.createElement('div');
    controls.className = 'rest-widget-controls';

    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'btn btn-secondary btn-xs';
    minusBtn.textContent = '-15s';
    minusBtn.onclick = (e) => {
      if (e) e.stopPropagation();
      this.adjustTime(-15);
    };

    const pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.id = 'rest-widget-pause-btn';
    pauseBtn.className = 'btn btn-primary btn-xs';
    pauseBtn.textContent = 'Pausar';
    pauseBtn.onclick = (e) => {
      if (e) e.stopPropagation();
      this.pause();
    };

    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'btn btn-secondary btn-xs';
    plusBtn.textContent = '+30s';
    plusBtn.onclick = (e) => {
      if (e) e.stopPropagation();
      this.adjustTime(30);
    };

    controls.appendChild(minusBtn);
    controls.appendChild(pauseBtn);
    controls.appendChild(plusBtn);
    widget.appendChild(controls);

    container.appendChild(widget);
    this._widgetEl = widget;
  }

  _renderWidgetUI() {
    if (!this._widgetEl) {
      this.mountFloatingWidget();
    }
    if (this._widgetEl) {
      this._widgetEl.classList.remove('hidden');
      this._updateWidgetDisplay();
    }
  }

  _updateWidgetDisplay() {
    const timeEl = document.getElementById('rest-widget-time-text');
    const pauseBtn = document.getElementById('rest-widget-pause-btn');

    if (timeEl) {
      if (this.remainingSeconds <= 0) {
        timeEl.textContent = '¡A LEVANTAR! ⚡';
      } else {
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }

    if (pauseBtn) {
      pauseBtn.textContent = this.isPaused ? 'Reanudar' : 'Pausar';
    }
  }
}

export const globalRestTimer = new GymRestTimer();
