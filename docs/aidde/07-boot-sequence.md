# Component: Boot Sequence

Executed by `context-manager` agent at the start of every session.

## Step 1: Authenticate
```bash
# GitHub App
gh auth status
[ -z "$AIDDE_APP_ID" ] && echo "❌ MISSING: AIDDE_APP_ID" && exit 1
[ -z "$AIDDE_APP_PRIVATE_KEY" ] && echo "❌ MISSING: AIDDE_APP_PRIVATE_KEY" && exit 1

# Google Cloud
gcloud auth list
gcloud config get project

# Firebase
firebase projects:list 2>/dev/null | head -5
```

## Step 2: Memory Hydration (Sync GitHub State)
```bash
# Fetch all active Milestones (Features)
gh api repos/{owner}/{repo}/milestones \
  --jq '.[] | {id:.number, title:.title, state:.state, open_issues:.open_issues}'

# Fetch all open Issues (Tasks) with parent Milestones
gh issue list --state open \
  --json number,title,milestone,assignees,labels,createdAt

# List all feature branches
gh api repos/{owner}/{repo}/branches \
  --jq '.[].name' | grep "^feature/"

# Identify stale branches (no commits in 14 days)
for branch in $(git branch -r | grep "feature/"); do
  LAST=$(git log -1 --format="%ar" "origin/$branch" 2>/dev/null)
  echo "$branch: $LAST"
done
```

## Step 3: Self-Correction
- Issue with no Milestone → flag as orphan, ask user to assign parent
- Branch with no linked Issue → flag, ask: keep | close | link
- Branch stale 14+ days → flag, ask: continue | close | reassign

**Never auto-delete or auto-close. Always ask.**

## Step 4: Ready State
```
✅ AIDDE Boot Complete
───────────────────────────────
GitHub:           {owner}/{repo}
GCP Project:      {id}
Firebase Project: {id}

Active Features (Milestones): {n}
Open Tasks (Issues):           {n}
Active Branches:               {n}

⚠️ Stale Branches:   {list or "none"}
⚠️ Orphaned Issues:  {list or "none"}
───────────────────────────────
Awaiting your first prompt.
```
