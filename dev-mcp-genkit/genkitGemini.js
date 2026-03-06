// Genkit MCP Gemini API integration (development-only)
// Usage: require and call getGeminiSuggestion(prompt) directly in orchestrator.service.js
// No endpoint exposed; for local dev use only
const fetch = require('node-fetch');

const GEMINI_API_URL = 'https://generativeai.googleapis.com/v1/models/gemini-pro:generateContent';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

async function getGeminiSuggestion(prompt) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 256, temperature: 0.7 }
  };
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  return result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0] && result.candidates[0].content.parts[0].text ? result.candidates[0].content.parts[0].text : '';
}

module.exports = { getGeminiSuggestion };
