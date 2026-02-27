# verify-blaze.ps1
# Script to verify Firebase Blaze plan status and Firestore connectivity.

Write-Host "--- Verifying Firebase Project Status ---" -ForegroundColor Cyan
firebase projects:list --json | ConvertFrom-Json | Select-Object -ExpandProperty result | Where-Object { $_.projectId -eq "sentient-ai-browser" } | Format-List

Write-Host "--- Testing Firestore Connection ---" -ForegroundColor Cyan
node test-firestore.js

Write-Host "--- Checking Cloud Functions Logs ---" -ForegroundColor Cyan
firebase functions:log --lines 10
