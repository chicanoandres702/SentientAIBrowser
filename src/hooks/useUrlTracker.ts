// Feature: Core | Trace: README.md
import { useEffect } from 'react';
import { recordSuccessWeight, recordDisqualificationPenalty, initSurveyDB } from '../../shared/survey-memory-db';

/**
 * Monitors the current URL for patterns that indicate a successful 
 * survey completion or a disqualification event.
 * Automates the "Success Weight" feedback loop for the AI.
 */
export const useUrlTracker = (activeUrl: string, workflowIds: string[], sessionAnswerIds: string[]) => {
    useEffect(() => {
        const checkUrlPatterns = async () => {
            if (!sessionAnswerIds || sessionAnswerIds.length === 0) return;

            // Swagbucks patterns (examples based on typical behavior)
            const isSuccess = activeUrl.includes('survey/complete') ||
                activeUrl.includes('swagbucks.com/p/congrats') ||
                activeUrl.includes('finish') ||
                activeUrl.includes('success');

            const isDisqualified = activeUrl.includes('survey/disqualified') ||
                activeUrl.includes('swagbucks.com/p/disq') ||
                activeUrl.includes('sorry') ||
                activeUrl.includes('not-a-fit');

            if (isSuccess) {
                console.log(`[useUrlTracker] Success detected! Updating ${sessionAnswerIds.length} memory entries...`);
                try {
                    await recordSuccessWeight(sessionAnswerIds);
                } catch (e) {
                    console.error("Failed to update success weight:", e);
                }
            }

            if (isDisqualified) {
                console.log(`[useUrlTracker] Disqualification detected. Penalizing ${sessionAnswerIds.length} memory entries...`);
                try {
                    // Penalyze all answers in the session as they led to failure
                    for (const id of sessionAnswerIds) {
                        await recordDisqualificationPenalty(id);
                    }
                } catch (e) {
                    console.error("Failed to update penalty weight:", e);
                }
            }
        };

        if (activeUrl) {
            checkUrlPatterns();
        }
    }, [activeUrl, sessionAnswerIds]);
};
