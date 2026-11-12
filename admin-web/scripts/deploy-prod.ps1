# One-command production deploy.
#
# Builds and runs the panel image directly on the server's Docker daemon over SSH — nothing
# is built or stored locally, no image tar is shipped. Requires only the docker CLI and an
# ssh client locally; the server needs nothing but its existing Docker install.
#
#   pwsh scripts/deploy-prod.ps1
#
# Run it from the repository root.

param(
    # Host alias from ~/.ssh/config, or user@host.
    [string]$SshHost = 'sose2026-android2',
    # Backend the panel calls. Baked into the bundle at build time.
    [string]$ApiBaseUrl = 'https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org',
    # Public URL path the panel is served from. Must match the Nginx location on the server.
    [string]$BasePath = '/admin/',
    # Loopback port the container publishes on the server.
    [int]$Port = 8081,
    # Public URL used for the final smoke test.
    [string]$PublicUrl = 'https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org/admin/'
)

$ErrorActionPreference = 'Stop'
$image = 'admin-web-prod:latest'
$env:DOCKER_HOST = "ssh://$SshHost"

function Invoke-Step {
    param([string]$Name, [scriptblock]$Action)
    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
}

Invoke-Step "Building $image on $SshHost" {
    docker build --target web-prod `
        --build-arg VITE_API_BASE_URL=$ApiBaseUrl `
        --build-arg VITE_BASE_PATH=$BasePath `
        -t $image .
}

Invoke-Step "Restarting the container on $SshHost" {
    docker rm -f admin-web-prod 2>$null
    docker run -d --name admin-web-prod --restart unless-stopped -p "127.0.0.1:${Port}:80" $image
}

Write-Host ""
Write-Host "==> Internal smoke test on $SshHost" -ForegroundColor Cyan
Start-Sleep -Seconds 2
$code = ssh $SshHost "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$Port$BasePath"
Write-Host "container $BasePath -> $code"
if ($code -ne '200') { throw "Container smoke test failed with status $code" }

Invoke-Step "Pruning old images on $SshHost" {
    docker image prune -f
}

Write-Host ""
Write-Host "==> Public smoke test" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri $PublicUrl -UseBasicParsing
Write-Host "$PublicUrl -> $($response.StatusCode)"
if ($response.Content -match 'assets/(index-[A-Za-z0-9_-]+\.js)') {
    Write-Host "serving bundle: $($Matches[1])"
}

Write-Host ""
Write-Host "Deploy complete." -ForegroundColor Green
