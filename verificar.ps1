# Compuerta de Calidad Integral - Desarrollo Ágil Dataholics
$Raiz = $PSScriptRoot
$Web = if (Test-Path (Join-Path $Raiz "apps\web")) { Join-Path $Raiz "apps\web" } else { Join-Path $Raiz "frontend" }
$Api = if (Test-Path (Join-Path $Raiz "apps\api")) { Join-Path $Raiz "apps\api" } elseif (Test-Path (Join-Path $Raiz "backend\api")) { Join-Path $Raiz "backend\api" } else { Join-Path $Raiz "backend" }
$Fallas = 0

Write-Host ""
Write-Host "=================================================="
Write-Host ">>> 1. Frontend: Typecheck (tsc --noEmit)"
Write-Host "=================================================="
if (Test-Path $Web) {
    Set-Location $Web
    if (Test-Path "tsconfig.json") {
        npx tsc --noEmit
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[FAIL] Frontend Typecheck fallo" -ForegroundColor Red
            $Fallas++
        } else {
            Write-Host "[OK] Frontend Typecheck paso" -ForegroundColor Green
        }
    } else {
        Write-Host "[INFO] tsconfig.json no detectado en $Web (Proyecto en JS/JSX), saltando typecheck..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Frontend no encontrado, saltando..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=================================================="
Write-Host ">>> 2. Frontend: Lint (oxlint / eslint)"
Write-Host "=================================================="
if (Test-Path $Web) {
    Set-Location $Web
    if (Get-Command oxlint -ErrorAction SilentlyContinue) {
        npx oxlint
    } else {
        npm run lint
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FAIL] Frontend Lint fallo" -ForegroundColor Red
        $Fallas++
    } else {
        Write-Host "[OK] Frontend Lint paso" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=================================================="
Write-Host ">>> 3. Backend: Rutas de API"
Write-Host "=================================================="
if (Test-Path $Api) {
    Set-Location $Api
    if ((Test-Path "spark") -and (Test-Path "vendor")) {
        php spark routes
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[FAIL] Backend Rutas fallo" -ForegroundColor Red
            $Fallas++
        } else {
            Write-Host "[OK] Backend Rutas paso" -ForegroundColor Green
        }
    } elseif (-not (Test-Path "vendor")) {
        Write-Host "[INFO] Backend vendor no instalado (sesion frontend), saltando chequeo de rutas..." -ForegroundColor Yellow
    } else {
        Write-Host "[INFO] Archivo spark no encontrado en $Api, saltando..." -ForegroundColor Yellow
    }
}

Set-Location $Raiz

Write-Host ""
Write-Host "=================================================="
if ($Fallas -eq 0) {
    Write-Host "[OK] COMPUERTA EN VERDE - Todos los chequeos pasaron correctamente." -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] COMPUERTA ROJA - $Fallas chequeos fallaron." -ForegroundColor Red
    exit 1
}
