import { SurveyData } from './types';

/**
 * Calculates the profit yield of a survey (SB per minute).
 * Higher is better.
 */
export function calculateYield(reward: number, time: number): number {
    if (time <= 0) return 0;
    return reward / time;
}

/**
 * Parses raw DOM nodes (from AIDomScanner) into strictly typed SurveyData objects.
 * This function uses heuristics to identify what looks like a survey in the DOM.
 */
export function parseSurveyNodes(domNodes: any[]): SurveyData[] {
    const surveys: SurveyData[] = [];

    // This is a naive implementation; actual Swagbucks DOM might need more complex parsing
    for (const node of domNodes) {
        // Example heuristic: A node with text containing "SB" and "Min" might be a survey card.
        const text = node.text || '';
        if (text.includes('SB') && (text.includes('Min') || text.includes('min'))) {

            // Attempt to extract numeric values using Regex
            // Usually format is "100 SB" or "100SB"
            const sbMatch = text.match(/(\d+)\s*SB/i);
            // Usually format is "15 Min" or "15 mins"
            const minMatch = text.match(/(\d+)\s*Min/i);

            if (sbMatch && minMatch) {
                const rewardSB = parseInt(sbMatch[1], 10);
                const timeMinutes = parseInt(minMatch[1], 10);

                surveys.push({
                    id: node.id,
                    title: text.substring(0, 30).trim() + '...', // First 30 chars as title for context
                    rewardStr: sbMatch[0],
                    timeStr: minMatch[0],
                    rewardSB,
                    timeMinutes,
                    yieldRatio: calculateYield(rewardSB, timeMinutes)
                });
            }
        }
    }

    return surveys;
}
