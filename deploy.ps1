#Requires -Version 5.1
<#
.SYNOPSIS
    GRC Triple Crown - Azure Deployment Script (PowerShell)
.DESCRIPTION
    Deploys the GRC Triple Crown platform to Azure Container Apps.
    Skips already-created resources (RG, ACR). Database is Neon (external, see NEON_DATABASE_URL).
    Requires: az CLI logged in, NEON_DATABASE_URL environment variable set.
.EXAMPLE
    .\deploy.ps1
#>

$ErrorActionPreference = "Continue"
$LOG = "$env:TEMP\deploy_remaining_log.txt"

# ============================================
# Configuration
# ============================================
$RESOURCE_GROUP = "rg-sankanou"
$LOCATION = "japaneast"
$ACR_NAME = "sankanouacr"
$CONTAINER_ENV_NAME = "sankanou-env"
$API_APP_NAME = "sankanou-api"
$WEB_APP_NAME = "sankanou-web"
$JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() }
$AI_RESOURCE_NAME = "sankanou-ai"
$AI_RESOURCE_LOCATION = "eastus2"  # AIServicesはEast US 2で利用可能 (Claude対応リージョン)

function Log($msg) {
    $ts = Get-Date -Format "HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line -ForegroundColor Cyan
    Add-Content -Path $LOG -Value $line
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "GRC Triple Crown - Azure Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
"DEPLOY_START $(Get-Date)" | Set-Content $LOG

# ============================================
# 0. Check az login
# ============================================
Log "Step 0: Checking Azure login..."
$account = az account show --output json 2>$null | ConvertFrom-Json
if ($account) {
    Log "  Logged in as: $($account.user.name)"
} else {
    Log "  Not logged in. Running az login..."
    az login
}

# ============================================
# 1. Register providers (if needed)
# ============================================
Log "Step 1: Registering resource providers..."
az provider register -n Microsoft.OperationalInsights 2>$null
az provider register -n Microsoft.App 2>$null
Log "  Registration initiated. Waiting 90 seconds..."
Start-Sleep -Seconds 90
Log "  Wait complete. Proceeding..."

# ============================================
# 2. Database (Neon - free serverless Postgres)
# ============================================
# Azure Database for PostgreSQL Flexible Serverは常時起動の時間課金(月額約$15-18)が
# 避けられないため、代わりにNeon(https://neon.tech)の無料枠を使う。標準的なPostgres
# プロトコルで、pgvector拡張にも対応しており、本アプリのコード変更は不要。
Log "Step 2: Configuring database (Neon)..."

if (-not $env:NEON_DATABASE_URL) {
    Write-Host "ERROR: NEON_DATABASE_URL is not set." -ForegroundColor Red
    Write-Host ""
    Write-Host "Set up a free Neon Postgres database first:"
    Write-Host "  1. Sign up at https://neon.tech (free tier)"
    Write-Host "  2. Create a project (nearest region to Japan: 'ap-southeast-1' / Singapore)"
    Write-Host "  3. In the Neon SQL Editor, run: CREATE EXTENSION IF NOT EXISTS vector;"
    Write-Host "  4. Copy the connection string from the Neon dashboard"
    Write-Host "  5. Re-run:"
    Write-Host '     $env:NEON_DATABASE_URL = "postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"'
    Write-Host "     .\deploy.ps1"
    exit 1
}

# NeonのURLスキームをasyncpgドライバ指定に変換し、sslmode=require (libpq形式) を
# このアプリが期待する ssl=require (asyncpg形式) に揃える。channel_binding=require は
# asyncpgが認識せず接続エラーになるため除去する。
$DATABASE_URL = $env:NEON_DATABASE_URL `
    -replace '^postgresql://', 'postgresql+asyncpg://' `
    -replace '^postgres://', 'postgresql+asyncpg://' `
    -replace 'sslmode=require', 'ssl=require' `
    -replace '[&?]channel_binding=require', ''
if ($DATABASE_URL -notmatch 'ssl=') {
    $separator = if ($DATABASE_URL -match '\?') { '&' } else { '?' }
    $DATABASE_URL = "${DATABASE_URL}${separator}ssl=require"
}
Log "  Using Neon database (from NEON_DATABASE_URL)"

# ============================================
# 3. Azure AI Foundry (AIServices) リソース
# ============================================
Log "Step 3: Creating AI Services resource..."
$existingAI = az cognitiveservices account show --resource-group $RESOURCE_GROUP --name $AI_RESOURCE_NAME --query name -o tsv 2>$null
if ($existingAI) {
    Log "  AI Services resource already exists."
} else {
    az cognitiveservices account create `
        --resource-group $RESOURCE_GROUP `
        --name $AI_RESOURCE_NAME `
        --kind AIServices `
        --sku S0 `
        --location $AI_RESOURCE_LOCATION `
        --custom-domain $AI_RESOURCE_NAME `
        --output none
    Log "  AI Services resource created."

    Log "  Deploying GPT-5-mini..."
    az cognitiveservices account deployment create `
        --resource-group $RESOURCE_GROUP `
        --name $AI_RESOURCE_NAME `
        --deployment-name "gpt-5-mini" `
        --model-name "gpt-5-mini" `
        --model-version "2025-08-07" `
        --model-format OpenAI `
        --sku-name "GlobalStandard" `
        --sku-capacity 10 `
        --output none
    Log "  GPT-5-mini deployed."

    Log "  Deploying GPT-5-nano..."
    az cognitiveservices account deployment create `
        --resource-group $RESOURCE_GROUP `
        --name $AI_RESOURCE_NAME `
        --deployment-name "gpt-5-nano" `
        --model-name "gpt-5-nano" `
        --model-version "2025-08-07" `
        --model-format OpenAI `
        --sku-name "GlobalStandard" `
        --sku-capacity 10 `
        --output none
    Log "  GPT-5-nano deployed."

    Log "  Deploying GPT-5.2-chat..."
    az cognitiveservices account deployment create `
        --resource-group $RESOURCE_GROUP `
        --name $AI_RESOURCE_NAME `
        --deployment-name "gpt-5.2-chat" `
        --model-name "gpt-5.2-chat" `
        --model-version "2025-12-11" `
        --model-format OpenAI `
        --sku-name "GlobalStandard" `
        --sku-capacity 10 `
        --output none
    Log "  GPT-5.2-chat deployed."
}

# ============================================
# 4. Check/Build API Image
# ============================================
Log "Step 4: Checking API image in ACR..."
$repos = az acr repository list --name $ACR_NAME -o tsv 2>$null
if ($repos -match "api") {
    Log "  API image already exists. Skipping build."
} else {
    Log "  Building API image (takes ~5 min)..."
    Push-Location $PSScriptRoot
    az acr build --registry $ACR_NAME --image api:latest --file docker/api/Dockerfile.prod . --no-logs
    Pop-Location
    Log "  API image built."
}

# ============================================
# 5. Container Apps Environment
# ============================================
Log "Step 5: Creating Container Apps environment..."
$existing = az containerapp env show --resource-group $RESOURCE_GROUP --name $CONTAINER_ENV_NAME --query name -o tsv 2>$null
if ($existing) {
    Log "  Environment already exists."
} else {
    az containerapp env create `
        --resource-group $RESOURCE_GROUP `
        --name $CONTAINER_ENV_NAME `
        --location $LOCATION `
        --output none
    Log "  Environment created."
}

# ============================================
# 6. Get ACR credentials
# ============================================
Log "Step 6: Getting ACR credentials..."
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer -o tsv
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv
Log "  ACR: $ACR_LOGIN_SERVER"

# ============================================
# 7. Deploy API Container App
# ============================================
Log "Step 7: Deploying API..."
$existingApi = az containerapp show --resource-group $RESOURCE_GROUP --name $API_APP_NAME --query name -o tsv 2>$null
if ($existingApi) {
    Log "  API app exists. Updating..."
    az containerapp update `
        --resource-group $RESOURCE_GROUP `
        --name $API_APP_NAME `
        --image "$ACR_LOGIN_SERVER/api:latest" `
        --output none
} else {
    $AI_KEY = az cognitiveservices account keys list --name $AI_RESOURCE_NAME --resource-group $RESOURCE_GROUP --query key1 -o tsv
    az containerapp create `
        --resource-group $RESOURCE_GROUP `
        --name $API_APP_NAME `
        --environment $CONTAINER_ENV_NAME `
        --image "$ACR_LOGIN_SERVER/api:latest" `
        --registry-server $ACR_LOGIN_SERVER `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD `
        --target-port 8000 `
        --ingress external `
        --min-replicas 0 `
        --max-replicas 1 `
        --cpu 0.5 `
        --memory 1.0Gi `
        --env-vars "DATABASE_URL=secretref:database-url" "AZURE_FOUNDRY_ENDPOINT=secretref:azure-foundry-endpoint" "AZURE_FOUNDRY_API_KEY=secretref:azure-foundry-key" "JWT_SECRET=secretref:jwt-secret" "API_RELOAD=false" "DEBUG=false" `
        --secrets "database-url=$DATABASE_URL" "azure-foundry-endpoint=https://${AI_RESOURCE_NAME}.cognitiveservices.azure.com/" "azure-foundry-key=$AI_KEY" "jwt-secret=$JWT_SECRET" `
        --output none
}

$API_FQDN = az containerapp show --resource-group $RESOURCE_GROUP --name $API_APP_NAME --query "properties.configuration.ingress.fqdn" -o tsv
$API_URL = "https://${API_FQDN}"
Log "  API: $API_URL"

# ============================================
# 8. Build Web Image (with API URL baked in)
# ============================================
Log "Step 8: Building Web image (takes ~5 min)..."
Push-Location $PSScriptRoot
az acr build --registry $ACR_NAME --image web:latest --file docker/web/Dockerfile.prod --build-arg "NEXT_PUBLIC_API_URL=$API_URL" . --no-logs
Pop-Location
Log "  Web image built."

# ============================================
# 9. Deploy Web Container App
# ============================================
Log "Step 9: Deploying Web..."
$existingWeb = az containerapp show --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --query name -o tsv 2>$null
if ($existingWeb) {
    Log "  Web app exists. Updating..."
    az containerapp update `
        --resource-group $RESOURCE_GROUP `
        --name $WEB_APP_NAME `
        --image "$ACR_LOGIN_SERVER/web:latest" `
        --output none
} else {
    az containerapp create `
        --resource-group $RESOURCE_GROUP `
        --name $WEB_APP_NAME `
        --environment $CONTAINER_ENV_NAME `
        --image "$ACR_LOGIN_SERVER/web:latest" `
        --registry-server $ACR_LOGIN_SERVER `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD `
        --target-port 3000 `
        --ingress external `
        --min-replicas 0 `
        --max-replicas 1 `
        --cpu 0.25 `
        --memory 0.5Gi `
        --output none
}

$WEB_FQDN = az containerapp show --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --query "properties.configuration.ingress.fqdn" -o tsv
$WEB_URL = "https://${WEB_FQDN}"
Log "  Web: $WEB_URL"

# ============================================
# 10. Update API CORS
# ============================================
Log "Step 10: Updating CORS..."
az containerapp update `
    --resource-group $RESOURCE_GROUP `
    --name $API_APP_NAME `
    --set-env-vars "CORS_ORIGINS=[`"${WEB_URL}`"]" `
    --output none
Log "  CORS configured."

# ============================================
# Summary
# ============================================
Log "=========================================="
Log "DEPLOYMENT COMPLETE"
Log "  API:  $API_URL"
Log "  Web:  $WEB_URL"
Log "=========================================="

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Seed DB:" -ForegroundColor White
Write-Host "     az containerapp exec -g $RESOURCE_GROUP -n $API_APP_NAME --command 'python -m seed.seed_db'" -ForegroundColor Gray
Write-Host "  2. Test:  curl $API_URL/api/v1/health" -ForegroundColor White
Write-Host "  3. Open:  $WEB_URL" -ForegroundColor White
Write-Host ""
Write-Host "Cost note: Container Apps + Neon(free tier) is near `$0 when idle." -ForegroundColor DarkGray
Write-Host "The only fixed cost is ACR Basic (~`$5/month)." -ForegroundColor DarkGray
Write-Host ""
Write-Host "Tear down: az group delete --name $RESOURCE_GROUP --yes --no-wait" -ForegroundColor DarkGray
Write-Host "           (delete the Neon project separately from the neon.tech dashboard)" -ForegroundColor DarkGray
