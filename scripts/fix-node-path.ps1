# Corrige ambiente para npm no PowerShell:
# 1) Garante Node.js no PATH do usuario
# 2) Tenta politica CurrentUser RemoteSigned (quando aplicavel)
# 3) Se LocalMachine for Restricted, a politica efetiva pode continuar bloqueando npm.ps1;
#    nesse caso adiciona shim no perfil do usuario para "npm" chamar npm.cmd (sem admin).

$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path $PSScriptRoot -Parent
$logPath = Join-Path $workspaceRoot 'debug-a5d830.log'
$sessionId = 'a5d830'

function Write-AgentLog {
    param([string]$HypothesisId, [string]$Message, [hashtable]$Data)
    $payload = [ordered]@{
        sessionId    = $sessionId
        hypothesisId = $HypothesisId
        location     = 'scripts/fix-node-path.ps1'
        message      = $Message
        data         = $Data
        timestamp    = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    }
    ($payload | ConvertTo-Json -Compress -Depth 8) | Add-Content -Path $logPath -Encoding UTF8
}

$candidates = @(
    (Join-Path $env:ProgramFiles 'nodejs'),
    (Join-Path ${env:ProgramFiles(x86)} 'nodejs'),
    (Join-Path $env:LOCALAPPDATA 'Programs\nodejs')
)

$nodeDir = $candidates | Where-Object { Test-Path (Join-Path $_ 'npm.cmd') } | Select-Object -First 1

if (-not $nodeDir) {
    Write-AgentLog -HypothesisId 'H0' -Message 'npm.cmd not found' -Data @{}
    Write-Error 'npm.cmd nao encontrado nas pastas padrao. Instale o Node.js LTS em https://nodejs.org/'
    exit 1
}

$npmCmdPath = Join-Path $nodeDir 'npm.cmd'

# --- PATH usuario ---
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not $userPath) { $userPath = '' }
$parts = $userPath -split ';' | Where-Object { $_ -and $_.Trim() }
$pathChanged = $false
if ($parts -notcontains $nodeDir) {
    $newUserPath = $nodeDir + ';' + ($parts -join ';')
    [Environment]::SetEnvironmentVariable('Path', $newUserPath.TrimEnd(';'), 'User')
    $pathChanged = $true
    Write-Host "PATH do usuario atualizado com: $nodeDir"
} else {
    Write-Host "PATH do usuario ja contem: $nodeDir"
}
$env:Path = $nodeDir + ';' + $env:Path

Write-AgentLog -HypothesisId 'H1' -Message 'PATH' -Data @{
    nodeDir      = $nodeDir
    pathChanged  = $pathChanged
}

# --- Politicas (todas as scopes) ---
$polList = Get-ExecutionPolicy -List | ForEach-Object {
    @{ scope = $_.Scope.ToString(); executionPolicy = $_.ExecutionPolicy.ToString() }
}
$cuPol = (Get-ExecutionPolicy -Scope CurrentUser).ToString()
$lmPol = (Get-ExecutionPolicy -Scope LocalMachine).ToString()
$effective = (Get-ExecutionPolicy).ToString()

Write-AgentLog -HypothesisId 'H2' -Message 'ExecutionPolicy list before' -Data @{
    scopes       = $polList
    effective    = $effective
}

# Restricted/AllSigned no usuario; ou efetiva Restricted com CU Undefined.
$needsRelax =
    ($cuPol -in @('Restricted', 'AllSigned')) -or
    ($cuPol -eq 'Undefined' -and $effective -eq 'Restricted')

if ($needsRelax) {
    try {
        Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
        Write-Host 'Politica de execucao (CurrentUser) definida como RemoteSigned.'
        Write-AgentLog -HypothesisId 'H3' -Message 'Set-ExecutionPolicy RemoteSigned CurrentUser' -Data @{ applied = $true; error = $null }
    } catch {
        Write-AgentLog -HypothesisId 'H3' -Message 'Set-ExecutionPolicy RemoteSigned CurrentUser' -Data @{ applied = $false; error = $_.Exception.Message }
        Write-Warning "Nao foi possivel alterar politica do usuario: $($_.Exception.Message)"
    }
} else {
    Write-Host "Politica CurrentUser: $cuPol (efetiva: $effective); sem Set-ExecutionPolicy."
    Write-AgentLog -HypothesisId 'H3' -Message 'ExecutionPolicy Set skipped' -Data @{ scopeCurrentUser = $cuPol; effective = $effective }
}

$effectiveAfter = (Get-ExecutionPolicy).ToString()
$cuAfter = (Get-ExecutionPolicy -Scope CurrentUser).ToString()

Write-AgentLog -HypothesisId 'H4' -Message 'ExecutionPolicy after' -Data @{
    scopeLocalMachine = $lmPol
    scopeCurrentUser  = $cuAfter
    effective         = $effectiveAfter
}

# --- H5: LocalMachine Restricted prevalece; npm.ps1 continua bloqueado ---
$machineBlocks = ($lmPol -eq 'Restricted')
if ($machineBlocks -or $effectiveAfter -in @('Restricted', 'AllSigned')) {
    Write-AgentLog -HypothesisId 'H5' -Message 'Effective policy still blocks scripts or LM Restricted' -Data @{
        localMachine        = $lmPol
        effectiveAfter      = $effectiveAfter
        willInstallProfileShim = $true
    }

    $marker = '# CanvaText-npm-shim'
    $profilePath = $PROFILE.CurrentUserAllHosts
    $profileDir = Split-Path -Parent $profilePath
    if (-not (Test-Path -LiteralPath $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }

    $shimBlock = @"

$marker
if (Test-Path -LiteralPath '$($npmCmdPath.Replace("'", "''"))') {
  function global:npm {
    param([Parameter(ValueFromRemainingArguments = `$true)] `$npmArgs)
    & '$($npmCmdPath.Replace("'", "''"))' @npmArgs
  }
}
"@

    $already = $false
    if (Test-Path -LiteralPath $profilePath) {
        $already = Select-String -LiteralPath $profilePath -Pattern ([regex]::Escape($marker)) -Quiet
    }
    if (-not $already) {
        Add-Content -LiteralPath $profilePath -Value $shimBlock -Encoding UTF8
        Write-Host ''
        Write-Host 'Perfil PowerShell atualizado: funcao npm() agora chama npm.cmd'
        Write-Host "Arquivo: $profilePath"
        Write-AgentLog -HypothesisId 'H6' -Message 'Profile shim installed' -Data @{ profilePath = $profilePath; npmCmdPath = $npmCmdPath }
    } else {
        Write-Host 'Shim npm no perfil ja existe; nada a adicionar.'
        Write-AgentLog -HypothesisId 'H6' -Message 'Profile shim already present' -Data @{ profilePath = $profilePath }
    }

    # Sessao atual: definir funcao para nao precisar reabrir so para testar
    function global:npm {
        param([Parameter(ValueFromRemainingArguments = $true)] $npmArgs)
        & $npmCmdPath @npmArgs
    }
    Write-Host ''
    Write-Host 'Nesta sessao, npm ja aponta para npm.cmd. Teste: npm --version'
} else {
    Write-AgentLog -HypothesisId 'H5' -Message 'No profile shim needed' -Data @{
        localMachine   = $lmPol
        effectiveAfter = $effectiveAfter
    }
}

Write-Host ''
Write-Host 'Abra um NOVO terminal no Cursor e teste: npm --version'
Write-Host 'Se ainda falhar, use: npm.cmd --version'
