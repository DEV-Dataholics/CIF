param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Email = "admin@cif.mx",
    [string]$Password = "cif2026"
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session
    )

    $params = @{
        Method      = $Method
        Uri         = $Url
        WebSession  = $Session
        ContentType = "application/json"
        Headers     = @{ Accept = "application/json" }
    }

    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }

    $resp = Invoke-WebRequest @params
    if (-not $resp.Content) {
        return @{}
    }
    return ($resp.Content | ConvertFrom-Json)
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Step "Login"
$login = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/login" -Body @{
    email    = $Email
    password = $Password
} -Session $session

if (-not $login.ok) {
    throw "Login failed: $($login | ConvertTo-Json -Depth 5)"
}
Write-Host "Login OK as $($login.usuario.email)"

$folio = "SMK-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$uuid = [guid]::NewGuid().ToString().ToUpper()

Write-Step "Create factura"
$create = Invoke-Json -Method "POST" -Url "$BaseUrl/cobranza" -Body @{
    folio            = $folio
    uuid             = $uuid
    cliente          = "SMOKE CLIENTE"
    concepto         = "Prueba automatizada de cobranza"
    monto            = 12345.67
    subtotal         = 12000.00
    moneda           = "MXN"
    forma_pago       = "03"
    metodo_pago      = "PUE"
    rfc_emisor       = "CIF850101AAA"
    rfc_receptor     = "XAXX010101000"
    nombre_emisor    = "CIF LOGISTICA"
    fecha_emision    = (Get-Date).ToString("yyyy-MM-dd")
    fecha_vencimiento= (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    notas            = "smoke test"
} -Session $session

if (-not $create.ok) {
    throw "Create failed: $($create | ConvertTo-Json -Depth 5)"
}
$facturaId = [int]$create.id
Write-Host "Create OK. id=$facturaId folio=$folio"

Write-Step "List facturas"
$list = Invoke-Json -Method "GET" -Url "$BaseUrl/cobranza" -Body $null -Session $session
if (-not $list.ok) {
    throw "List failed: $($list | ConvertTo-Json -Depth 5)"
}
$found = $list.facturas | Where-Object { $_.id -eq $facturaId }
if (-not $found) {
    throw "Created factura not found in list"
}
Write-Host "List OK. Found id=$facturaId with estatus=$($found.estatus)"

Write-Step "Mark factura as pagada"
$pay = Invoke-Json -Method "PUT" -Url "$BaseUrl/cobranza/$facturaId/pagar" -Body @{
    fecha_pago = (Get-Date).ToString("yyyy-MM-dd")
    notas      = "pagada via smoke test"
} -Session $session

if (-not $pay.ok) {
    throw "Pay failed: $($pay | ConvertTo-Json -Depth 5)"
}
Write-Host "Pay OK. id=$($pay.id) estatus=$($pay.estatus)"

Write-Step "Verify paid status"
$list2 = Invoke-Json -Method "GET" -Url "$BaseUrl/cobranza" -Body $null -Session $session
$updated = $list2.facturas | Where-Object { $_.id -eq $facturaId }
if (-not $updated -or $updated.estatus -ne "pagada") {
    throw "Factura status was not updated to pagada"
}
Write-Host "Verification OK. Smoke test passed." -ForegroundColor Green

Write-Step "Logout"
$null = Invoke-Json -Method "POST" -Url "$BaseUrl/auth/logout" -Body @{} -Session $session
Write-Host "Logout OK"
