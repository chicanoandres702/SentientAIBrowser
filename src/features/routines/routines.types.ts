/*
 * [Parent Feature/Milestone] Routines
 * [Child Task/Issue] Saved workflow type definitions
 * [Subtask] RoutineItem shape mirrors Firestore 'routines' collection
 * [Upstream] Firestore routines collection -> [Downstream] use-routines.hook + routine-picker
 * [Law Check] 18 lines | Passed 100-Line Law
 */

export interface RoutineItem {
  id:          string;
  userId:      string;
  name:        string;
  description: string;
  initialUrl:  string;
  steps:       string[];
  createdAt:   number;
  updatedAt?:  number;
}
