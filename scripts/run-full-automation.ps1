# AIDDE TRACE HEADER
# PowerShell script to trigger full automation pipeline via GitHub CLI
# Why: Enables local one-click build, push, and test for proxy + Android app

# Requires GitHub CLI (gh) installed and authenticated

gh workflow run full-automation.yml
