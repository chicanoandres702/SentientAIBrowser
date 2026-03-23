// Feature: Core | Trace: AI_CONSTITUTION.md (Section 11)
import { startFlowServer } from '@genkit-ai/express';
import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';

const ai = genkit({
    plugins: [googleAI()],
    model: 'gemini-1.5-flash',
});

export const sentientHealthCheck = ai.defineFlow(
    {
        name: 'sentientHealthCheck',
        inputSchema: z.string().describe('Name to greet'),
        outputSchema: z.string(),
    },
    async (name) => {
        const { text } = await ai.generate(`Hello ${name}, I am the Sentient AI Browser backend. I am operational and ready to assist.`);
        return text;
    }
);

console.log('Starting Genkit Flow Server...');
startFlowServer({
    flows: [sentientHealthCheck],
    port: 3400,
});
console.log('Genkit Flow Server running on port 3400');

// Keep the process alive for MCP connectivity
process.stdin.resume();
