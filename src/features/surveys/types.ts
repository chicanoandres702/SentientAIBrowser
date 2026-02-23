export interface SurveyData {
  id: string; // The DOM ID of the element or custom AI tag
  title: string;
  rewardStr: string;
  timeStr: string;
  rewardSB: number;
  timeMinutes: number;
  yieldRatio: number; // SB per minute
}
