/**
 * @license MIT
 * Copyright (c) 2026 Honduras Bromatology Analyzer Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import { createHash } from 'node:crypto';
import { config } from '../config.js';

export class ImageCache {
  constructor({ maxItems = config.cacheMaxItems, ttlMs = config.cacheTtlMs } = {}) {
    this.maxItems = maxItems;
    this.ttlMs = ttlMs;
    this.cache = new Map();
    this.inFlight = new Map();
  }

  static generateKey(imagePayload, model = config.geminiModel, schemaVersion = config.schemaVersion) {
    const hash = createHash('sha256');
    if (Buffer.isBuffer(imagePayload)) {
      hash.update(imagePayload);
    } else {
      hash.update(String(imagePayload));
    }
    hash.update(`:${model}:${schemaVersion}`);
    return hash.digest('hex');
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (entry.expiresAt <= now) {
      this.cache.delete(key);
      return null;
    }

    entry.lastAccessed = now;
    // Refresh LRU ordering by reinserting
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key, data) {
    const now = Date.now();
    this.pruneExpired(now);

    if (this.cache.size >= this.maxItems && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      expiresAt: now + this.ttlMs,
      lastAccessed: now
    });
  }

  has(key) {
    return this.get(key) !== null;
  }

  pruneExpired(now = Date.now()) {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  evictLeastRecentlyUsed() {
    let oldestKey = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  async getOrCompute(key, computeFn) {
    const cachedData = this.get(key);
    if (cachedData !== null) {
      return { data: cachedData, cacheHit: true };
    }

    let inflightPromise = this.inFlight.get(key);
    if (!inflightPromise) {
      inflightPromise = (async () => {
        try {
          const freshData = await computeFn();
          this.set(key, freshData);
          return freshData;
        } finally {
          this.inFlight.delete(key);
        }
      })();

      this.inFlight.set(key, inflightPromise);
    }

    const data = await inflightPromise;
    return { data, cacheHit: false };
  }

  clear() {
    this.cache.clear();
    this.inFlight.clear();
  }

  size() {
    this.pruneExpired();
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();
