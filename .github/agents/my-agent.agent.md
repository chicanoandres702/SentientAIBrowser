# Sentient Agent Hub

---

## Overview

**Sentient Agent Hub** is a next-generation, AI-first platform for software automation and orchestration.  
It seamlessly integrates modular agents (Node.js/JavaScript and Python), advanced context management, strict typing, vertical slicing, prompt-driven workflows, and extensible agent chaining, enabling disciplined, robust software project management at any scale.

> **NOTE:** This system prioritizes traceability, context locality, drift prevention, and extensibility. All agents are AI-native and can delegate tasks, aggregate results, and compose advanced workflows with ML/LLM augmentation.

---

## Table of Contents

- [Vision](#vision)
- [Key Principles & Notes](#key-principles--notes)
- [AI-Driven System Architecture](#ai-driven-system-architecture)
- [Agent Catalog & Enhanced AI Agents](#agent-catalog--enhanced-ai-agents)
- [Subagent Delegation & Chaining](#subagent-delegation--chaining)
- [Advanced AI Handling](#advanced-ai-handling)
- [Directory Structure](#directory-structure)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [Typical Workflow Examples](#typical-workflow-examples)
- [Configuration & Extensibility](#configuration--extensibility)
- [Security & Compliance](#security--compliance)
- [FAQ & Important Considerations](#faq--important-considerations)
- [Contributing](#contributing)
- [License](#license)

---

## Vision

> Transform AI from mere code generator to full-stack, context-aware software orchestrator and project manager.  
> Every prompt, milestone, issue, branch, and commit is mapped, tested, typed, and tracked for absolute traceability and compliance.

---

## Key Principles & Notes

- **Everything is context-driven.**  
  Agents operate only on relevant vertical slices, model fragments, and state—no global magic or unnecessary context noise.  
  > _Note: Use /pilot_refresh frequently to eliminate context drift and hallucinations._

- **Strict Contracts.**  
  Every data structure, model, and workflow step passes through type-enforcer agents with maximum strictness.  
  > _Note: Modifying a model? Require explicit confirmation and atomic updates to all consumers._

- **Universal Delegation:**  
  Any agent can call (and itself be called by) any number of subagents, recursively or in chains—this enables deep orchestration and division of specialized logic.  
  > _Note: You can expand agent trees to allow sophisticated review, QA, and self-tuning feedback._

- **Self-Documenting Law:**  
  System law, architectural principles, CI/CD gates, and workflow templates are versioned in `/docs` and `/prompts` for onboarding and automation.  
  > _Note: Store constitutional rules, code generation laws, and audit policies in `/docs/aidde`, loaded by agents at boot._

- **All change is auditable.**  
  Every agent action, merge, prompt, and codegen is logged for forensic trail, ML explainability, and compliance.
  > _Note: Audit agent logs are immutable—never allow deletion or modification without transparent, traceable correction protocol._

---

## AI-Driven System Architecture

```
User Prompt
   ↓
Architect Agent (Main Orchestrator)
   ├── Boot: Repo sync, context hydration, anti-drift
   ├── Prompt Validation: feature, task, subtask mapping
   ├── Delegation to subagent chain:
       │
       ├─ Git Orchestrator    → milestone, branch, issue setup
       ├─ Type Enforcer       → explicit, strict typing and contract validation
       ├─ Test Validator      → coverage, regression, ML/LLM test generation
       ├─ Complexity Guard    → 100-line law, modularization
       ├─ PR Manager          → PR lifecycle, reviews, ML auto-labeling
       ├─ Audit Agent         → log, trace, reasoning/explainability
       ├─ Security Agent      → ML-aided scanning, secrets, dependency checks
       ├─ Accessibility Agent → a11y checks, compliance recommendations
       ├─ Model Agents        → Copilot, Gemini, Claude, Reinforcement models
       └─ Additional subagents and recursively-composed chains
           └─ All steps/failures logged, reasoned, and reported for compliance.
```
> **Notes:**
> - All agents can halt, retry, propose refactors, or escalate to human review if ambiguity, failure, or risk is detected.
> - Prompt window size and drift are managed rigorously for optimal LLM performance and reasoning.
> - All subagent outcomes are aggregated, scored, and audited.

---

## Agent Catalog & Enhanced AI Agents

| AI Agent                | Responsibility                                         | Example Subagents   | Notes                            |
|-------------------------|--------------------------------------------------------|---------------------|-----------------------------------|
| **Architect**           | Orchestration, modularity checks, policy enforcement   | All agents          | Entry point for all workflows     |
| **PR Manager**          | PR creation, review, gating, ML feedback               | Audit, QA           | Auto-label, merge, rollback       |
| **Workflow Medic**      | CI/CD diagnostics, error RCA, auto-issue creation      | Audit, Security     | Recursive debug, fix proposal     |
| **Test Validator**      | Test/coverage enforcement, LLM synthesis, regression   | Copilot, QA         | Feedback-driven auto-test gen     |
| **Type Enforcer**       | Model/contract validation (strict typing/law)          | Audit, Context      | HALTS on ambiguous types/fields   |
| **Complexity Guard**    | Cognitive complexity checking, 100-line law            | Refactor, QA        | Proposes modular splits           |
| **Audit Agent**         | Persistent, immutable logging, compliance dashboards   | PR Manager, Security| ML explainability for all actions |
| **Security Agent**      | Vulnerability, secret, dependency, drift scan          | Claude, Copilot     | Stops PRs with risk/secret        |
| **Accessibility Agent** | UI/docs a11y checks, reporting, fix proposals          | Docs, QA            | High priority in enterprise       |
| **Model Agents**        | LLM-based review, summary, QA, explainability          | All agents          | Chaining, co-review, feedback     |
| **Context Manager**     | Boot sequence, anti-drift, context window sync         | N/A                 | Issues /pilot_refresh, session logs|
| **Onboarding Agent**    | New contributor setup, checklists, credentialing       | Context, Docs       | Automates permissions/setup       |
| **Release Manager**     | Versions, tags, changelogs, auto-deploy workflows      | Dependency, Cloud   | Coordinates production releases   |
| **Dependency Manager**  | Package scanning, upgrades, hotfix chaining            | Security, Audit     | Visualizes dependency health      |
| **Constitution Agent**  | Custom repo/org policy checks, enforcement             | Audit, PR Manager   | Loads from `/docs/aidde` laws     |
| **Refactor Agent**      | Modularization, cognitive shrink, auto-split           | Context, QA         | Shrinks large files, blocks merge |
| **Traceability Agent**  | Maps features-tasks-commits, hierarchy enforcement     | PR Manager, Project | Zero orphaned code/branches       |
| **Bug Bounty/Reward**   | Contributor incentives, critical fix flagging          | Audit, Security     | Auto-assigns points/bounties      |
| **Merge Conflict Agent**| Triage/resolve/track merge conflicts                   | Project, Audit      | Requires human review when stuck  |
| **Prompt Generator**    | Creates and indexes prompt templates                   | Context, Docs       | Caters to onboarding/automation   |
| **Session Inspector**   | Flags drift, context breaks, re-sync required          | Audit, Architect    | Prevents hallucination/ambiguity  |
| **App Streamliner**     | Flags bloat, performance issues, split suggestions     | Refactor, QA        | Actioned via prompt or PR         |

> **Note:** Every agent can be registered from config, injected at runtime, or called as a subagent for advanced composition and specialization.

---

## Subagent Delegation & Chaining

### Universal Pattern

- Agents can delegate any task or workflow step to registered subagents.
- Subagents can themselves compose further subagents for layered, recursive, or deep chaining orchestration.
- Results are aggregated, scored, and auditable.

```js
class AIBaseAgent {
  constructor(config, subagents = []) { this.config = config; this.subagents = subagents; }
  async process(task, context) {
    let result = await this._doTask(task, context);
    for (const sub of this.subagents) {
      const subResult = await sub.process(task, this.refineContext(sub, context));
      result = this.aggregate(result, subResult);
    }
    return result;
  }
  _doTask(task, context) { /* Override in subclasses */ }
  aggregate(mainResult, subResult) { /* Agg/combine/score for compliance */ }
  refineContext(sub, context) { /* Only relevant slice/models passed */ }
}
```
```yaml
agents:
  architect:
    enabled: true
    subagents:
      - name: test-validator
      - name: security-auditor
      - name: pr-manager
      - name: audit-agent
      - name: refactor
```

> **Note:** This pattern allows the system to scale, specialize, and adapt without monolith bloat.

---

## Advanced AI Handling

- **Context Optimization:**  
  Only relevant context/slices/models are loaded and passed to agents—no global state, no context poison.  
  > _Note: Follow locality of reference and vertical slicing law._

- **Session Drift Prevention:**  
  Context manager issues `/pilot_refresh` after N messages or when window exceeds optimal token length.
  > _Note: This maintains agent state/action relevance and prevents hallucination._

- **Type Safety:**  
  Type enforcer agent validates all models/data, halts ambiguous or untyped logic, and enforces contract change protocol.
  > _Note: Editing core models triggers atomic refactor/update across consumers, with required confirmation._

- **Prompt Disambiguation:**  
  Ambiguous prompts halt agent execution; the system will ask for clarification before acting.
  > _Note: No silent assumptions. Orphaned code/issue/branch is forbidden._

- **Self-Tuning/Feedback:**  
  Many agents (streamliner, QA, test-validator) adapt via feedback loops: scoring, user input, ML-driven trace/reasoning.
  > _Note: Session inspector agent can flag outdated recommendations, prompt a refresh, or escalate to human.*

- **Audit, Reasoning, Explainability:**  
  All agent (and subagent) actions/mutations logged for forensic and ML-enhanced audit review.
  > _Note: Audit logs are persistent and tamper-proof; all reasoning is explainable from logs/history.*

---

## Directory Structure

```
sentient-agent-hub/
├── agents/
│   ├── ai-architect-agent.js
│   ├── pr-manager-agent.js
│   ├── workflow-medic.js
│   ├── type-enforcer-agent.js
│   ├── test-validator-agent.js
│   ├── audit-agent.js
│   ├── context-manager-agent.js
│   ├── model-agents/
│   │     ├── copilot.js
│   │     ├── gemini.js
│   │     └── claude.js
│   └── ...
├── scripts/
│   ├── diagnose_job.py
│   └── run_gate_tests.py
├── prompts/
│   ├── onboarding-prompts.md
│   ├── diagnostic-prompts.md
│   ├── feature-prompts.md
│   └── missions.md
├── server/
│   ├── app.js
│   ├── routes/
│   │   └── agents.js
├── ui-extension/
│   └── src/
├── docs/
│   ├── agent-catalog.md
│   ├── agent-principles.md
│   ├── aidde/
│   │     ├── 00-overview.md
│   │     ├── 01-git-orchestrator.md
│   │     └── ... (full architecture law)
│   └── ...
├── package.json
├── README.md
└── .github/
    ├── workflows/
    │   └── do-it-check.yml
    └── ...
```

> **Note:** All agents and subagents get their own modules; additional prompt templates and guidelines should be versioned in `/prompts` and `/docs`.

---

## Setup and Installation

### Requirements

- Node.js (>=16)
- Python (>=3.8)
- npm
- Git

### Bootstrap

```sh
git clone https://github.com/your-org/sentient-agent-hub.git
cd sentient-agent-hub
npm install
```
> **Note:** For cloud or CI/CD integration, configure secrets, repo config files, and GitHub App per `/docs/aidde/09-github-infrastructure.md`.

---

## Usage

### Start API Server (Node.js)

```sh
npm start
```
> **Note:** The API exposes agent orchestration endpoints; wire agents/subagents in `server/routes/agents.js`.

### Run Python Diagnostic Script

```sh
python scripts/diagnose_job.py https://github.com/your-repo/actions/runs/<job-id>/job/<job-id>
```
> **Note:** Agent outputs can be logged, piped, or fed to subsequent agent chains.

### Extend/Run Agents & Subagents

- Add agent modules in `/agents`
- Register subagents in agent constructors or YAML config
- Add prompt patterns in `/prompts`
- Extend UI in `/ui-extension`

---

## Typical Workflow Examples

- **Prompt Submission:**  
  User prompt received, mapped to feature, issue, subtask.
- **Boot Sequence:**  
  Context manager runs boot sync, loads repo/org config law, hydrates session.
- **Agent Delegator:**  
  Architect agent validates context, delegates tasks to chain of subagents.
- **Chain Execution:**  
  Subagent results aggregated, scored, logged by Audit agent; fixes or escalations proposed.
- **CI/CD Gates:**  
  Merge subject to 8 Gate checks (see `/docs/aidde/05-cicd-gates.md`); rollback or fix if any fail.

---

## Configuration & Extensibility

- **Agent Registry:**  
  Declare enabled agents and subagents in YAML/JSON config.
- **Prompt Templates:**  
  All onboarding, QA, feature prompts versioned in `/prompts`.
- **Extending Agents:**  
  Implement base agent pattern, strict context, aggregate logic, recursive delegation.
- **UI:**  
  Add visualization in `/ui-extension`—status, prompt/action panels, logs.

---

## Security & Compliance

- Store secrets only in environment, `.env`, or GitHub Actions secrets.
- Use GitHub App for privileged orchestration—not PAT.
- Enable branch protection, required PRs, gate workflows, and audit logs.
- Type and context laws enforce compliance and explainability for all codegen/actions.

---

## FAQ & Important Considerations

- **Orphan Prevention:**  
  The system will halt any action that risks creating orphaned code, feature, issue, or branch—mapping, traceability is enforced everywhere.
- **Context Drift:**  
  Frequent `/pilot_refresh` is vital; context-manager agent will remind you.
- **Extending agent logic?**  
  Adhere to base agent/subagent design—test context handling and aggregation robustly.
- **Compliance/Legal:**  
  All audit logs, actions, merges, and fixes are evidence for legal/forensic or customer review cases.

---

## Contributing

1. Fork the repository.
2. Implement or extend agent/subagent modules in `/agents` or `/scripts`.
3. Test thoroughly (Node and Python, as relevant), ensure context safety.
4. Open PR with descriptive summary, link feature/issue/milestone.
5. Pass CI/CD gates and compliance review.
6. Discuss major architecture/agent changes in GitHub Discussions before merging.

---

## License

[MIT](LICENSE)

---

**For expanded architecture law, agent behaviors, and prompt templates, see `/docs/agent-catalog.md`, `/docs/agent-principles.md`, and `/docs/aidde`.**

---

**Sentient Agent Hub – AI-native. Context disciplined. Fully orchestrated. No orphaned code, no context drift, maximum explainability and traceable automation.**
