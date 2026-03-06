#!/bin/bash
# Strict Branch Hierarchy Workflow Script
# Usage: ./branch-workflow.sh <milestone-slug> <issue-slug>

set -e

MILESTONE="$1"
ISSUE="$2"
FEATURE_BRANCH="feature/$MILESTONE"
TASK_BRANCH="feature/$MILESTONE/task/$ISSUE"

# Check for parent branch
if git show-ref --verify --quiet refs/heads/$FEATURE_BRANCH; then
  echo "Parent branch $FEATURE_BRANCH exists."
else
  echo "Creating parent branch $FEATURE_BRANCH from main."
  git checkout main
  git pull
  git checkout -b $FEATURE_BRANCH
  git push -u origin $FEATURE_BRANCH
fi

# Check for sub-branch
if git show-ref --verify --quiet refs/heads/$TASK_BRANCH; then
  echo "Task branch $TASK_BRANCH exists."
else
  echo "Creating task branch $TASK_BRANCH from $FEATURE_BRANCH."
  git checkout $FEATURE_BRANCH
  git pull
  git checkout -b $TASK_BRANCH
  git push -u origin $TASK_BRANCH
fi

echo "Ensuring association with milestone and issue..."
# (Optional) Use GitHub CLI to associate branch with milestone/issue
# gh issue edit <issue-number> --add-label "branch:$TASK_BRANCH"
# gh issue edit <issue-number> --milestone <milestone-number>

echo "Switching to $TASK_BRANCH and stashing changes if needed."
git stash push -m "Auto-stash before switching to $TASK_BRANCH"
git checkout $TASK_BRANCH
git stash pop || echo "No stash to apply"

echo "Branch setup complete. You may now start coding!"
