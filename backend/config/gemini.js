const { GoogleGenAI } = require('@google/genai');

const rawKey = process.env.GEMINI_API_KEY;
const hasRealKey =
  Boolean(rawKey) &&
  rawKey !== 'MY_GEMINI_API_KEY' &&
  !rawKey.includes('MY_GEMINI_API_KEY') &&
  rawKey.length > 15;

const ai = hasRealKey
  ? new GoogleGenAI({
      apiKey: rawKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

module.exports = { ai, hasRealKey };
