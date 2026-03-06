// Gemini file rewrite utility for orchestrator
// Usage: rewriteFileWithGemini(filePath, prompt)

const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.VERTEX_AI_PROJECT || 'sentient-ai-browser',
  location: process.env.VERTEX_AI_LOCATION || 'us-central1',
});

/**
 * Rewrites a file using Gemini, based on a prompt.
 * @param {string} filePath - Absolute path to the file to rewrite
 * @param {string} prompt - The prompt describing the rewrite
 * @returns {Promise<void>}
 */
async function rewriteFileWithGemini(filePath, prompt) {
  const original = fs.readFileSync(filePath, 'utf8');
  // Use structured schema for rewrite
  const schema = {
    task: 'rewrite',
    instruction: prompt,
    file: original,
    language: filePath.endsWith('.ts') ? 'typescript' : filePath.endsWith('.js') ? 'javascript' : 'unknown',
    context: 'Automated Gemini rewrite via orchestrator',
  };
  const fullPrompt = `Schema:\n${JSON.stringify(schema, null, 2)}\n\nRewrite the file according to the schema above. Return ONLY the new file contents. Do NOT use code block ticks or any extra formatting. Output just the code.`;
  // Use model selection logic from testGeminiApi.js
  const models = await ai.models.list();
  // Prefer gemini-2.0-flash-lite-001 if available
  let model = models.pageInternal.find(m => m.name.includes('gemini-2.0-flash-lite-001'))?.name || models.pageInternal[0]?.name;
  const result = await ai.models.generateContent({
    model,
    contents: fullPrompt,
  });
  console.log('[Gemini API Response]', JSON.stringify(result, null, 2)); // Log full Gemini API response
  const newContent = result.text || (result.candidates && result.candidates[0]?.output) || '';
  if (!newContent) throw new Error('Gemini did not return any content.');
  fs.writeFileSync(filePath, newContent, 'utf8');
}

module.exports = { rewriteFileWithGemini };
