"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateYield = calculateYield;
exports.parseSurveyNodes = parseSurveyNodes;
/**
 * Calculates the profit yield of a survey (SB per minute).
 * Higher is better.
 */
function calculateYield(reward, time) {
    if (time <= 0)
        return 0;
    return reward / time;
}
/**
 * Parses raw DOM nodes (from AIDomScanner) into strictly typed SurveyData objects.
 * This function uses heuristics to identify what looks like a survey in the DOM.
 */
function parseSurveyNodes(domNodes) {
    const surveys = [];
    for (const node of domNodes) {
        const text = node.text || '';
        // Heuristic: Check for reward (SB) and duration (Min/mins)
        // We look for patterns like "100 SB", "100SB", "15 Min", "15 mins", "15m"
        const hasSB = / \d+\s*SB/i.test(text);
        const hasMin = /\d+\s*(Min|mins|m)\b/i.test(text);
        if (hasSB || hasMin) {
            // Attempt extraction
            const sbMatch = text.match(/(\d+)\s*SB/i);
            const minMatch = text.match(/(\d+)\s*(Min|mins|m)\b/i);
            if (sbMatch && minMatch) {
                const rewardSB = parseInt(sbMatch[1], 10);
                const timeMinutes = parseInt(minMatch[1], 10);
                // Deduping: If we already found a survey with this ID (due to multiple text nodes), skip
                if (surveys.find(s => s.id === node.id))
                    continue;
                surveys.push({
                    id: node.id,
                    title: text.substring(0, 50).trim() + '...',
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
//# sourceMappingURL=surveys.utils.js.map