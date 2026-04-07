param(
    [string]$BackendHealthUrl = "http://localhost:8080/actuator/health",
    [int]$WaitSeconds = 90
)

$ErrorActionPreference = "Stop"
if ($null -ne (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue)) {
    $PSNativeCommandUseErrorActionPreference = $false
}

function Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    exit 1
}

function Pass {
    param([string]$Message)
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

Info "Checking Docker CLI availability..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Fail "docker command not found in PATH"
}
Pass "docker command available"

Info "Checking Docker daemon..."
& docker version --format "{{.Server.Version}}" *> $null
if ($LASTEXITCODE -ne 0) {
    Fail "Docker daemon is not running"
}
Pass "Docker daemon is running"

Info "Validating compose configuration..."
$null = docker compose config -q 2>$null
if ($LASTEXITCODE -ne 0) {
    Fail "docker compose config is invalid"
}
Pass "Compose configuration is valid"

Info "Starting services (build + detach)..."
$null = docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    Fail "docker compose up -d --build failed"
}
Pass "Services started"

Info "Waiting up to $WaitSeconds seconds for backend health endpoint..."
$deadline = (Get-Date).AddSeconds($WaitSeconds)
$healthy = $false
while ((Get-Date) -lt $deadline) {
    try {
        $response = Invoke-RestMethod -Uri $BackendHealthUrl -Method Get -TimeoutSec 5
        if ($null -ne $response.status -and $response.status -eq "UP") {
            $healthy = $true
            break
        }
    }
    catch {
        Start-Sleep -Seconds 2
        continue
    }

    Start-Sleep -Seconds 2
}

if (-not $healthy) {
    Write-Host ""
    Write-Host "Backend logs (last 120 lines):" -ForegroundColor Yellow
    docker compose logs --tail=120 backend
    Fail "Backend health endpoint did not become UP in time"
}
Pass "Backend health endpoint is UP"

Info "Checking compose service status..."
$psOutput = docker compose ps
$psOutput | ForEach-Object { Write-Host $_ }

if ($psOutput -match "Restarting") {
    Fail "At least one service is restarting"
}

Pass "Docker stack validation completed successfully"
