# Cria o repositório no GitHub e envia a branch main (ou só faz push se "origin" já existir).
# Pré-requisito (uma vez):  gh auth login
# Uso (na raiz do projeto):
#   .\scripts\push-para-github.ps1
#   .\scripts\push-para-github.ps1 -RepoName o-nome-que-quiser

param(
    [string]$RepoName = "canvatext"
)

$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\GitHub CLI;C:\Program Files\Git\bin;" + $env:Path

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$authOk = $false
& gh auth status 1>$null 2>&1
if ($LASTEXITCODE -eq 0) { $authOk = $true }
if (-not $authOk) {
    Write-Host "Ainda não estás autenticado no GitHub. Na PowerShell, executa UMA VEZ:" -ForegroundColor Yellow
    Write-Host "  gh auth login" -ForegroundColor Cyan
    Write-Host "Escolhe GitHub.com, HTTPS e autentica no browser." -ForegroundColor Yellow
    exit 1
}

# Não usar "git remote get-url origin" — em PowerShell isso escreve erro e falha com $ErrorActionPreference Stop
$remotes = @(git remote 2>$null)
$hasOrigin = $remotes -contains "origin"

if (-not $hasOrigin) {
    Write-Host "A criar repositório remoto público: $RepoName" -ForegroundColor Green
    & gh repo create $RepoName --public --source=. --remote=origin --push
} else {
    Write-Host "Remote 'origin' já existe. A fazer push para main..." -ForegroundColor Green
    git push -u origin main
}

Write-Host "Concluído." -ForegroundColor Green
