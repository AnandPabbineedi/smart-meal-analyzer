// modelManager.js
// Dynamic Gemini model selector with least-token prioritization and automatic fallback.

export const TOKEN_RANKED_MODELS = [
  'gemini-1.5-flash-8b',             // Lowest latency, least token consumption & compute cost (8B parameter model)
  'gemini-2.0-flash-lite',          // Google's 2.0 lite model optimized for low token/compute cost
  'gemini-2.0-flash-lite-preview-02-05',
  'gemini-1.5-flash',               // Standard high-speed multimodal model
  'gemini-2.0-flash',               // Next-gen 2.0 multimodal model
  'gemini-1.5-pro',                 // Higher capability fallback if all flash tiers are exhausted
];

let cachedAvailableModels = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Dynamically queries Google Generative Language API to discover which models
 * are currently available for this API key, ordered by least token consumption.
 */
export async function getAvailableLeastModels(apiKey) {
  const now = Date.now();
  if (cachedAvailableModels && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedAvailableModels;
  }

  if (!apiKey) {
    return TOKEN_RANKED_MODELS;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models)) {
        // Collect model names that support generateContent
        const activeModelSet = new Set(
          data.models
            .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
            .map((m) => m.name.replace(/^models\//, ''))
        );

        // Filter our token-ranked list to models that actually exist for this key
        const available = TOKEN_RANKED_MODELS.filter((m) => activeModelSet.has(m));
        if (available.length > 0) {
          cachedAvailableModels = available;
          lastCacheTime = now;
          console.log(`[AI] Dynamically detected ${available.length} available models (least token ordered):`, available);
          return available;
        }
      }
    }
  } catch (err) {
    console.warn(`[AI] Could not fetch live model list (${err.message}). Using standard ranked fallback list.`);
  }

  // Graceful fallback to ranked list if discovery is unreachable
  return TOKEN_RANKED_MODELS;
}

/**
 * Executes generateContent with dynamic fallback across least-token models.
 * Tries the preferred model first (if specified and valid), then iterates through
 * models ordered by least token consumption before showing any error to the user.
 */
export async function generateContentWithDynamicFallback({
  genAI,
  apiKey,
  parts,
  preferredModel,
  generationConfig = {},
}) {
  const availableModels = await getAvailableLeastModels(apiKey);

  // Build ordered list of candidate models:
  // If a valid preferred model was specified, start with it; otherwise start directly with least-token model
  const candidates = [];
  if (preferredModel && preferredModel !== 'gemini-2.5-flash' && !candidates.includes(preferredModel)) {
    candidates.push(preferredModel);
  }

  for (const model of availableModels) {
    if (!candidates.includes(model)) {
      candidates.push(model);
    }
  }

  let lastError = null;

  for (const modelName of candidates) {
    try {
      console.log(`[AI] Analyzing meal with model: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig,
      });

      const response = await model.generateContent(parts);
      const text = response.response.text();

      console.log(`[AI] Analysis successful with model: ${modelName}`);
      return {
        text,
        modelUsed: modelName,
      };
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || '');
      console.warn(`[AI] Model "${modelName}" failed: ${msg}. Checking next available least-token model...`);

      // Content safety blocks usually apply across models for the same image
      if (msg.includes('SAFETY')) {
        throw err;
      }
      // For 429 (traffic/quota), 404 (model not found), 503 (service unavailable), 500, etc.
      // Continue loop to next least token model
    }
  }

  // All candidates failed; throw last error
  throw lastError || new Error('All AI models are currently unavailable.');
}
