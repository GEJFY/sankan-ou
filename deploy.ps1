#Requires -Version 5.1
<#
.SYNOPSIS
    GRC Triple Crown - Azure Deployment Script (PowerShell)
.DESCRIPTION
    Deploys the GRC Triple Crown platform to Azure Container Apps.
    Skips already-created resources (RG, ACR, PostgreSQL).
    Requires: az CLI logged in.
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
$DB_SERVER_NAME = "sankanou-db"
$DB_NAME = "sankanou"
$DB_ADMIN_USER = "sankanouadmin"
$DB_ADMIN_PASSWORD = if ($env:DB_ADMIN_PASSWORD) { $env:DB_ADMIN_PASSWORD } else { [System.Web.Security.Membership]::GeneratePassword(20,3) -replace '[{}()|]','x' }
$CONTAINER_ENV_NAME = "sankanou-env"
$API_APP_NAME = "sankanou-api"
$WEB_APP_NAME = "sankanou-web"
$JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString() }
$OPENAI_RESOURCE_NAME = "sankanou-openai"

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
# 2. PostgreSQL config (RG, ACR, PG already exist)
# ============================================
Log "Step 2: Configuring PostgreSQL..."

Log "  Firewall rule..."
az postgres flexible-server firewall-rule create `
    --resource-group $RESOURCE_GROUP `
    --name $DB_SERVER_NAME `
    --rule-name "AllowAzureServices" `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 `
    --output none 2>$null
Log "  Firewall done."

Log "  pgvector extension..."
az postgres flexible-server parameter set `
    --resource-group $RESOURCE_GROUP `
    --server-name $DB_SERVER_NAME `
    --name azure.extensions `
    --value "vector,uuid-ossp" `
    --output none 2>$null
Log "  pgvector done."

Log "  Creating database..."
az postgres flexible-server db create `
    --resource-group $RESOURCE_GROUP `
    --server-name $DB_SERVER_NAME `
    --database-name $DB_NAME `
    --output none 2>$null
Log "  Database done."

$DB_HOST = "${DB_SERVER_NAME}.postgres.database.azure.com"
$DATABASE_URL = "postgresql+asyncpg://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?ssl=require"

# ============================================
# 3. Check/Build API Image
# ============================================
Log "Step 3: Checking API image in ACR..."
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
# 4. Container Apps Environment
# ============================================
Log "Step 4: Creating Container Apps environment..."
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
# 5. Get ACR credentials
# ============================================
Log "Step 5: Getting ACR credentials..."
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer -o tsv
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv
Log "  ACR: $ACR_LOGIN_SERVER"

# ============================================
# 6. Deploy API Container App
# ============================================
Log "Step 6: Deploying API..."
$existingApi = az containerapp show --resource-group $RESOURCE_GROUP --name $API_APP_NAME --query name -o tsv 2>$null
if ($existingApi) {
    Log "  API app exists. Updating..."
    az containerapp update `
        --resource-group $RESOURCE_GROUP `
        --name $API_APP_NAME `
        --image "$ACR_LOGIN_SERVER/api:latest" `
        --output none
} else {
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
        --env-vars "DATABASE_URL=secretref:database-url" "AZURE_OPENAI_ENDPOINT=secretref:azure-openai-endpoint" "AZURE_OPENAI_API_KEY=secretref:azure-openai-key" "JWT_SECRET=secretref:jwt-secret" "API_RELOAD=false" "DEBUG=false" `
        --secrets "database-url=$DATABASE_URL" "azure-openai-endpoint=https://${OPENAI_RESOURCE_NAME}.openai.azure.com/" "azure-openai-key=$(az cognitiveservices account keys list --name $OPENAI_RESOURCE_NAME --resource-group $RESOURCE_GROUP --query key1 -o tsv)" "jwt-secret=$JWT_SECRET" `
        --output none
}

$API_FQDN = az containerapp show --resource-group $RESOURCE_GROUP --name $API_APP_NAME --query "properties.configuration.ingress.fqdn" -o tsv
$API_URL = "https://${API_FQDN}"
Log "  API: $API_URL"

# ============================================
# 7. Build Web Image (with API URL baked in)
# ============================================
Log "Step 7: Building Web image (takes ~5 min)..."
Push-Location $PSScriptRoot
az acr build --registry $ACR_NAME --image web:latest --file docker/web/Dockerfile.prod --build-arg "NEXT_PUBLIC_API_URL=$API_URL" . --no-logs
Pop-Location
Log "  Web image built."

# ============================================
# 8. Deploy Web Container App
# ============================================
Log "Step 8: Deploying Web..."
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
# 9. Update API CORS
# ============================================
Log "Step 9: Updating CORS..."
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
Write-Host "Tear down: az group delete --name $RESOURCE_GROUP --yes --no-wait" -ForegroundColor DarkGray
