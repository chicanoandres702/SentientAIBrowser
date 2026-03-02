// Feature: Missions | Trace: README.md
/*
 * [Parent Feature/Milestone] Missions
 * [Child Task/Issue] Mode detection
 * [Subtask] Detect mission mode (Scholar vs Survey) from URL patterns
 * [Upstream] Browser URL -> [Downstream] Mission mode classification
 * [Law Check] 37 lines | Passed 100-Line Law
 */

export type SentientMode = 'scholar' | 'survey' | 'manual';

const ACADEMIC_DOMAINS = [
  'capella.edu',
  'canvas.instructure.com',
  'blackboard.com',
  'coursera.org',
  'edx.org',
];

const SURVEY_DOMAINS = [
  'swagbucks.com',
  'userzoom.com',
  'qualtrics.com',
  'surveymonkey.com',
  'opinionbar.com',
  'prolific.co',
];

export const detectModeFromUrl = (url: string): SentientMode | null => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();

  if (ACADEMIC_DOMAINS.some((d) => lowerUrl.includes(d))) {
    return 'scholar';
  }

  if (SURVEY_DOMAINS.some((d) => lowerUrl.includes(d))) {
    return 'survey';
  }

  return null;
};
