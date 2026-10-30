/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * FitState - High-Performance Reactive State Engine (Proxy + Microtask Batching)
 */

export class FitState {
  /**
   * @param {Object} initialData 
   * @param {string} storageKey 
   */
  constructor(initialData = {}, storageKey = 'fitmate_reactive_state_v2') {
    this._storageKey = storageKey;
    this._listeners = new Map(); // Map<string, Set<Function>>
    this._pendingKeyPaths = new Set();
    this._isFlushScheduled = false;

    // Load from LocalStorage if available or hydrate with defaults
    let persisted = null;
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (raw) persisted = JSON.parse(raw);
    } catch (e) {
      console.warn('[FitState] Error parsing persisted storage:', e);
    }

    const mergedData = persisted ? this._deepMerge(initialData, persisted) : initialData;
    this.state = this._createProxy(mergedData, '');
  }

  _deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this._isObject(target) && this._isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this._isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = this._deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  _isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Blob);
  }

  _createProxy(target, basePath) {
    const self = this;
    return new Proxy(target, {
      get(obj, prop) {
        if (typeof prop === 'symbol' || prop === 'prototype') return obj[prop];
        const val = obj[prop];
        if (val !== null && typeof val === 'object' && !(val instanceof Blob)) {
          const currentPath = basePath ? `${basePath}.${prop}` : prop;
          return self._createProxy(val, currentPath);
        }
        return val;
      },

      set(obj, prop, value) {
        if (obj[prop] === value) return true;
        obj[prop] = value;
        const currentPath = basePath ? `${basePath}.${prop}` : prop;
        self._queueNotification(currentPath);
        return true;
      }
    });
  }

  _queueNotification(keyPath) {
    // Notify exact path and all ancestor key segments
    const parts = keyPath.split('.');
    for (let i = 1; i <= parts.length; i++) {
      this._pendingKeyPaths.add(parts.slice(0, i).join('.'));
    }

    if (!this._isFlushScheduled) {
      this._isFlushScheduled = true;
      queueMicrotask(() => this._flush());
    }
  }

  _flush() {
    this._isFlushScheduled = false;
    const paths = Array.from(this._pendingKeyPaths);
    this._pendingKeyPaths.clear();

    // Persist snapshot to LocalStorage safely
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this.state));
    } catch (err) {
      console.warn('[FitState] Failed to persist state snapshot:', err);
    }

    // Dispatch to registered subscribers
    for (const path of paths) {
      const subscribers = this._listeners.get(path);
      if (subscribers && subscribers.size > 0) {
        const value = this.get(path);
        for (const callback of subscribers) {
          try {
            callback(value, path);
          } catch (err) {
            console.error(`[FitState] Callback error on path '${path}':`, err);
          }
        }
      }
    }
  }

  /**
   * Subscribes a callback to changes at a specific keyPath
   * @param {string} keyPath (e.g. 'macros', 'profile.streak', 'workout.sets')
   * @param {Function} callback (value, keyPath) => void
   * @returns {Function} unsubscribe function
   */
  subscribe(keyPath, callback) {
    if (!this._listeners.has(keyPath)) {
      this._listeners.set(keyPath, new Set());
    }
    const set = this._listeners.get(keyPath);
    set.add(callback);

    // Immediate invocation with current value
    try {
      callback(this.get(keyPath), keyPath);
    } catch (err) {
      console.error(`[FitState] Initial subscription invocation error on '${keyPath}':`, err);
    }

    return () => {
      set.delete(callback);
      if (set.size === 0) this._listeners.delete(keyPath);
    };
  }

  /**
   * Retrieves value at keyPath or root state
   */
  get(keyPath) {
    if (!keyPath) return this.state;
    return keyPath.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), this.state);
  }
}
