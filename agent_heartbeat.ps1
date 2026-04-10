# StoryWeave Autonomous Heartbeat
# 45m Work / 20m Rest
# This script runs Claude Code in a loop and commits changes to Git.

$WorkSec = 2700  # 45 mins
$RestSec = 1200  # 20 mins
$StartH = 0      # 12 AM (Modified to run anytime for testing, set to 9 for 9 AM)
$EndH = 24       # 11:59 PM (Modified to run anytime for testing)

Write-Host "🚀 StoryWeave Developer Agent Online (Claude Code)..." -ForegroundColor Cyan

while ($true) {
    if ((Get-Date).Hour -ge $StartH -and (Get-Date).Hour -lt $EndH) {
        Write-Host "🟢 $(Get-Date): Work Session Starting (45m)..." -ForegroundColor Green
        
        # Trigger Claude Code autonomously
        claude -p "Read task.md, pick the absolute next uncompleted task, implement it fully in code, update task.md to check it off, and then safely exit."
        
        Write-Host "✅ Session Done. Saving to GitHub..." -ForegroundColor Yellow
        git add .
        git commit -m "Auto-build: Completed task segment [$(Get-Date)]"
        git push origin main
        
        Write-Host "😴 Resting for 20 minutes..." -ForegroundColor Gray
        Start-Sleep -Seconds $RestSec
    } else {
        Write-Host "🌙 Sleeping... Checking again in 1 hour." -ForegroundColor Gray
        Start-Sleep -Seconds 3600
    }
}
