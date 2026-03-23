// Feature: Orchestrator Contributor Onboarding Gate | Trace: orchestrator.gate.onboarding.js
const path = require('path');
const fs = require('fs');
const { traceLog } = require('./orchestrator.trace');

function gateContributorOnboarding() {
  const onboardingPrompt = path.join(__dirname, 'prompts', 'onboarding-prompts.md');
  if (!fs.existsSync(onboardingPrompt)) {
    traceLog('Gate: Contributor onboarding missing', { gate: 'contributor-onboarding', onboardingPrompt });
    throw new Error('Contributor onboarding gate failed: onboarding-prompts.md missing');
  }
  traceLog('Gate: Contributor onboarding present', { gate: 'contributor-onboarding', onboardingPrompt });
  return true;
}

module.exports = { gateContributorOnboarding };
