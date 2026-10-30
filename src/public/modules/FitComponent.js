/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * FitComponent - Abstract Web Component Base with Managed Lifecycle & Strict DOM Safety
 */

export class FitComponent extends HTMLElement {
  constructor() {
    super();
    this._managedListeners = [];
    this._stateUnsubscribers = [];
  }

  /**
   * Adds an event listener with automatic lifecycle cleanup on disconnectedCallback
   */
  addManagedListener(target, eventType, handler, options = {}) {
    if (!target) return;
    target.addEventListener(eventType, handler, options);
    this._managedListeners.push({ target, eventType, handler, options });
  }

  /**
   * Subscribes to the global FitState store with automatic unmount unsubscription
   */
  subscribeStore(keyPath, callback) {
    if (window.fitStore) {
      const unsub = window.fitStore.subscribe(keyPath, callback);
      this._stateUnsubscribers.push(unsub);
      return unsub;
    }
    return () => {};
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    // Teardown event listeners to prevent memory leaks
    for (const { target, eventType, handler, options } of this._managedListeners) {
      target.removeEventListener(eventType, handler, options);
    }
    this._managedListeners.length = 0;

    // Teardown state subscriptions
    for (const unsub of this._stateUnsubscribers) {
      unsub();
    }
    this._stateUnsubscribers.length = 0;
  }

  /**
   * Safe DOM node factory (Strictly avoids innerHTML)
   */
  createSafeEl(tag, className = '', textContent = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== '') el.textContent = textContent;
    return el;
  }

  /**
   * Abstract render method
   */
  render() {
    throw new Error(`[FitComponent] 'render()' must be implemented by ${this.constructor.name}`);
  }
}
