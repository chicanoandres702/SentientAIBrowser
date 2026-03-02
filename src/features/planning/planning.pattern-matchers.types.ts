// Feature: Planning | Trace: README.md
/*
 * [Parent Feature/Milestone] Planning
 * [Child Task/Issue] Types and utilities for pattern matching
 * [Subtask] Definitions and fallback patterns
 * [Law Check] 45 lines | Passed 100-Line Law
 */

export interface MissionSegment {
  name: string;
  steps: Array<{ explanation: string; action: string }>;
}

export const genericFallbackSegments = (): MissionSegment[] => [
  {
    name: 'Analyze Current Page',
    steps: [
      { explanation: 'Scan DOM for interactive elements', action: 'scan_dom' },
      { explanation: 'Identify relevant buttons and forms', action: 'find_interactive' },
    ],
  },
  {
    name: 'Perform Requested Action',
    steps: [{ explanation: 'Interact with the most relevant element', action: 'interact' }],
  },
  {
    name: 'Verify Completion',
    steps: [{ explanation: 'Check that the action succeeded', action: 'verify_result' }],
  },
];

/** Utility to detect and extract click target from prompt */
export const extractClickTarget = (prompt: string): string | null => {
  const targetMatch = prompt.match(
    /(?:click|navigate to)\s+(?:on\s+)?["']?([^"']+)["']?/i
  );
  return targetMatch ? targetMatch[1] : null;
};

/** Build segments from matched pattern */
export const buildSegments = (patterns: MissionSegment[][]): MissionSegment[] => {
  return patterns.find((p) => p.length > 0) || genericFallbackSegments();
};
