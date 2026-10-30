/**
 * @license MIT
 * Copyright (c) 2026 Honduras Bromatology Analyzer Contributors
 * Licensed under the MIT License. See LICENSE file in the project root.
 */

import { createRequire } from 'node:module';
import { config } from '../config.js';

const require = createRequire(import.meta.url);
const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/googleai');

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: config.geminiApiKey || undefined
    })
  ]
});

export { googleAI };
