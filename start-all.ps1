<#
start-all.ps1
Starts the backend server in a new PowerShell window and opens the frontend HTML.
Run: powershell -ExecutionPolicy Bypass -File start-all.ps1
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# Install backend dependencies if needed
if (-not (Test-Path "./backend/node_modules")) {
  Write-Host "Installing backend dependencies..."
  Push-Location backend
  npm install
  Pop-Location
}

# Start backend in a new PowerShell window so it stays running
Write-Host "Starting backend server..."
$backendDir = Join-Path $scriptDir "backend"
$npmCommand = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { "npm.cmd" } else { "npm" }
Start-Process -FilePath "powershell" -ArgumentList @('-NoExit','-Command',"Set-Location '$backendDir'; & '$npmCommand' start") -WindowStyle Normal

# Start frontend HTTP server for localhost access
Write-Host "Starting frontend server..."
Start-Process -FilePath "powershell" -ArgumentList @('-NoExit','-Command',"Set-Location '$scriptDir'; node .\frontend-server.js") -WindowStyle Normal

# Open the app in the default browser at the localhost URL
$frontendUrl = 'http://localhost:8000/maintenance_tracker.html'
Write-Host "Opening frontend at $frontendUrl"
Start-Process $frontendUrl
