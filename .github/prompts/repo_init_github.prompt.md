---
description: "GitHub infrastructure setup for AIDDE v2. Steps 1-7: repo features, Pages, branch protection, rulesets, labels, secrets checklist. Called by /repo_init."
argument-hint: "OWNER and REPO must be set"
agent: "agent"
tools: ["execute", "read"]
---

# /repo_init_github — GitHub Infrastructure Setup (Steps 1–7)

Requires: `OWNER`, `REPO` variables set.

## Step 1: Repo Features
```bash
gh api repos/$OWNER/$REPO -X PATCH \
  -f has_wiki=true -f has_issues=true -f has_discussions=true -f has_projects=true \
  -f allow_squash_merge=true -f allow_merge_commit=false \
  -f allow_rebase_merge=true -f delete_branch_on_merge=true
```

## Step 2: GitHub Pages
```bash
gh api repos/$OWNER/$REPO/pages -X POST \
  -f source='{"branch":"main","path":"/docs"}'
```

## Step 3: Branch Protection — main
```bash
gh api repos/$OWNER/$REPO/branches/main/protection -X PUT --input - <<EOF
{
  "required_status_checks": { "strict": true, "contexts": ["validate-aidde-quad"] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1, "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "required_conversation_resolution": true
}
EOF
```

## Step 4: Branch Protection — feature/*
```bash
gh api repos/$OWNER/$REPO/branches/feature%2F*/protection -X PUT --input - <<EOF
{
  "required_status_checks": { "strict": true, "contexts": ["validate-aidde-quad"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null
}
EOF
```

## Step 5: Rulesets
```bash
gh api repos/$OWNER/$REPO/rulesets -X POST --input - <<EOF
{
  "name": "AIDDE Ruleset", "target": "branch", "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" }, { "type": "non_fast_forward" },
    { "type": "required_signatures" },
    { "type": "pull_request", "parameters": { "required_approving_review_count": 1 } }
  ]
}
EOF
```

## Step 6: Standard Labels
```bash
for label in \
  "feature:0075ca:New feature or request" \
  "task:1d76db:Actionable work item bound to a milestone" \
  "bug:d73a4a:Something is broken" \
  "medic:e4e669:Requires RCA debugging" \
  "security:b60205:Security vulnerability or concern" \
  "100-line-violation:f9d0c4:File exceeds the 100-Line Law" \
  "needs-human-review:0e8a16:Conflict or decision requires human" \
  "stale:cfd3d7:No activity in 14+ days"; do
  N=$(echo $label|cut -d: -f1) C=$(echo $label|cut -d: -f2) D=$(echo $label|cut -d: -f3)
  gh label create "$N" --color "$C" --description "$D" --repo $OWNER/$REPO 2>/dev/null || \
  gh label edit "$N" --color "$C" --description "$D" --repo $OWNER/$REPO
done
```

## Step 7: Secrets Checklist
```
⚠️ Set these manually: GitHub → Settings → Secrets → Actions
  AIDDE_APP_ID          AIDDE_APP_PRIVATE_KEY    AIDDE_INSTALL_ID
  GCP_PROJECT_ID        GCP_REGION               GCP_SERVICE_ACCOUNT
  GCP_WORKLOAD_IDENTITY_PROVIDER
  FIREBASE_PROJECT_ID   FIREBASE_TOKEN
```

Confirm Steps 1–7 complete, then trigger `/repo_init_cloud`.
