param(
  [string]$PgUser = "postgres",
  [string]$DbName = "test",
  [string]$DbUser = "test",
  [string]$DbPass = "test"
)

$pgbin = if (Test-Path "C:\Program Files\PostgreSQL\17\bin") {
  "C:\Program Files\PostgreSQL\17\bin"
} elseif (Test-Path "C:\Program Files\PostgreSQL\16\bin") {
  "C:\Program Files\PostgreSQL\16\bin"
} else {
  Write-Error "PostgreSQL bin não encontrado."
  exit 1
}

$createdb = Join-Path $pgbin "createdb.exe"
$psql = Join-Path $pgbin "psql.exe"

Write-Host "Criando banco de dados '$DbName'..." -ForegroundColor Cyan
& $createdb -U $PgUser $DbName 2>$null
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
  Write-Warning "Erro ao criar banco (pode já existir)."
}

Write-Host "Criando usuário '$DbUser'..." -ForegroundColor Cyan
& $psql -U $PgUser -d $DbName -c "CREATE USER $DbUser WITH PASSWORD '$DbPass' SUPERUSER;" 2>$null

Write-Host "Concedendo permissões..." -ForegroundColor Cyan
& $psql -U $PgUser -d $DbName -c "GRANT ALL ON DATABASE $DbName TO $DbUser;"

Write-Host "Executando migrações..." -ForegroundColor Cyan
Set-Location (Join-Path $PSScriptRoot "..")
npx prisma migrate deploy

Write-Host "Test database '$DbName' pronto!" -ForegroundColor Green
