# One-command production deploy.
#
# Builds the panel image locally, ships it to the server as a saved image, and restarts the
# container there. The server never needs the source code, a Node toolchain, or a git pull:
# everything it runs is inside the image built here.
#
#   pwsh scripts/deploy-prod.ps1
#
# Run it from the repository root.

param(
    # Host alias from ~/.ssh/config, or user@host.
    [string]$SshHost = 'sose2026-android2',
    # Backend the panel calls. Baked into the bundle at build time.
    [string]$ApiBaseUrl = 'https://server.example.org',
    # Public URL path the panel is served from. Must match the Nginx location on the server.
    [string]$BasePath = '/admin/',
    # Loopback port the container publishes on the server.
    [int]$Port = 8081,
    # Public URL used for the final smoke test.
    [string]$PublicUrl = 'https://server.example.org/admin/'
)

$ErrorActionPreference = 'Stop'
$image = 'admin-web-prod:latest'
$archive = 'admin-web-prod.tar'

function Invoke-Step {
    param([string]$Name, [scriptblock]$Action)
    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
}

Invoke-Step "Building $image" {
    docker build --target web-prod `
        --build-arg VITE_API_BASE_URL=$ApiBaseUrl `
        --build-arg VITE_BASE_PATH=$BasePath `
        -t $image .
}

Invoke-Step "Saving the image to $archive" {
    docker save -o $archive $image
}

Invoke-Step "Copying the image to $SshHost" {
    scp $archive "${SshHost}:~/"
}

# Recreating the container is the only server-side change; Nginx is left untouched.
$remote = @"
set -e
docker load -i ~/$archive
docker rm -f admin-web-prod >/dev/null 2>&1 || true
docker run -d --name admin-web-prod --restart unless-stopped -p 127.0.0.1:${Port}:80 $image
rm -f ~/$archive
sleep 2
code=`$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${Port}${BasePath})
echo "container ${BasePath} -> `$code"
test "`$code" = "200"
docker image prune -f >/dev/null
df -h / | tail -1
"@

Invoke-Step "Loading and restarting the container on $SshHost" {
    $remote | ssh $SshHost 'bash -s'
}

Write-Host ""
Write-Host "==> Removing the local archive" -ForegroundColor Cyan
Remove-Item $archive -Force

Write-Host ""
Write-Host "==> Public smoke test" -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri $PublicUrl -UseBasicParsing
Write-Host "$PublicUrl -> $($response.StatusCode)"
if ($response.Content -match 'assets/(index-[A-Za-z0-9_-]+\.js)') {
    Write-Host "serving bundle: $($Matches[1])"
}

Write-Host ""
Write-Host "Deploy complete." -ForegroundColor Green
