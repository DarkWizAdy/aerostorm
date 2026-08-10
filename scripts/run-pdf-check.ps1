# Run once a day (via Windows Task Scheduler) to turn any new PDFs dropped in
# updates-pdfs/ into Update cards on the site. See scripts/process-update-pdfs.md
# for the actual instructions Claude follows, and updates-pdfs/README.md for
# how this is meant to be used day-to-day.

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$logFile = Join-Path $PSScriptRoot "pdf-check.log"
$promptFile = Join-Path $PSScriptRoot "process-update-pdfs.md"
$prompt = Get-Content $promptFile -Raw

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "----- Run started: $timestamp -----"

try {
    $output = & claude -p $prompt `
        --allowedTools "Read(updates-pdfs/**),Edit(/updates.json),Edit(/updates-manifest.json)" `
        2>&1
    Add-Content -Path $logFile -Value $output
    Add-Content -Path $logFile -Value "----- Run finished OK: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') -----`n"
} catch {
    Add-Content -Path $logFile -Value "ERROR: $_"
    Add-Content -Path $logFile -Value "----- Run finished WITH ERROR: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') -----`n"
    exit 1
}
