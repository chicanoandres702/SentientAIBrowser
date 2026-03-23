// Feature: Orchestrator Gates | Trace: orchestrator.gates.js
// Extracted tactical gate functions from orchestrator.service.js for modularity and Sentient compliance
const { gateAmbiguityDetection } = require('./gates.ambiguity');
const { gateRiskEscalation } = require('./gates.risk');
const { gateGitHierarchy } = require('./gates.git');
const { gateSecurityScan } = require('./gates.security');
// ...existing code for other gates...

module.exports = {
  gateAmbiguityDetection,
  gateRiskEscalation,
  gateEdgeCaseHandling,
  gateAutomatedFixProposal,
  gateGitHierarchy,
  gateContextDiscipline,
  gateTypeEnforcement,
  gateAuditLogging,
  gateOrphanPrevention,
  gateDriftPrevention,
  gatePromptDisambiguation,
  gateBranchProtection,
  gateSecurityScan,
};
