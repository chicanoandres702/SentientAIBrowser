/*
 * [Parent Feature/Milestone] Backend Execution
 * [Child Task/Issue] #cleanup — Remove duplicate Firebase Function executors
 * [Subtask] All mission execution now runs in Cloud Run (BackendAIOrchestrator.start)
 * [Law Check] 12 lines | Passed 100-Line Law
 *
 * WHY THIS FILE IS INTENTIONALLY EMPTY OF EXPORTS:
 *
 * sentientProxy (HTTP) — REMOVED:
 *   Duplicated the same Express app already running in Cloud Run.
 *   Cloud Run handles all /proxy, /agent and /screenshot routes.
 *
 * onMissionTrigger (Firestore trigger) — REMOVED:
 *   Fired on EVERY missionRef.update() call (status stays 'active' during execution).
 *   processMissionStep makes ~6 updates per cycle → 6 parallel unconstrained
 *   runMissionLoop invocations per cycle, each in a fresh Firebase Function process
 *   with an empty processingMissions Set → no mutex → contradictory LLM calls +
 *   navigation chaos.
 *
 *   Cloud Run BackendAIOrchestrator.start() already:
 *     • Listens on db.collection('missions').where('status','==','active').onSnapshot
 *     • Guards re-entry with processingMissions Set (in-process mutex)
 *     • Ignores 'modified' changes it caused itself
 */
export {};
