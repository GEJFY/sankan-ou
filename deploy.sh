#!/bin/bash
set -euo pipefail

# ============================================
# Configuration
# ============================================
RESOURCE_GROUP="rg-sankanou"
LOCATION="japaneast"
ACR_NAME="sankanouacr"
DB_SERVER_NAME="sankanou-db"
DB_NAME="sankanou"
DB_ADMIN_USER="sankanouadmin"
CONTAINER_ENV_NAME="sankanou-env"
API_APP_NAME="sankanou-api"
WEB_APP_NAME="sankanou-web"

# シークレット生成 (環境変数で上書き可能)
DB_ADMIN_PASSWORD="${DB_ADMIN_PASSWORD:-$(openssl rand -base64 24)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32)}"
OPENAI_RESOURCE_NAME="sankanou-openai"

echo "============================================"
echo "GRC Triple Crown - Azure Deployment"
echo "============================================"

# ============================================
# 1. Resource Group
# ============================================
echo ""
echo ">>> Step 1: Creating resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

# ============================================
# 2. Azure Container Registry (Basic)
# ============================================
echo ""
echo ">>> Step 2: Creating Container Registry..."
az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true \
    --output none

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
echo "   ACR: $ACR_LOGIN_SERVER"

# ============================================
# 3. PostgreSQL Flexible Server
# ============================================
echo ""
echo ">>> Step 3: Creating PostgreSQL Flexible Server..."
az postgres flexible-server create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER_NAME" \
    --location "$LOCATION" \
    --admin-user "$DB_ADMIN_USER" \
    --admin-password "$DB_ADMIN_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --version 16 \
    --yes \
    --output none

echo "   Configuring firewall..."
az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER_NAME" \
    --rule-name "AllowAzureServices" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none

echo "   Enabling pgvector..."
az postgres flexible-server parameter set \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$DB_SERVER_NAME" \
    --name azure.extensions \
    --value "vector,uuid-ossp" \
    --output none

echo "   Creating database..."
az postgres flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$DB_SERVER_NAME" \
    --database-name "$DB_NAME" \
    --output none

DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com"
DATABASE_URL="postgresql+asyncpg://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?ssl=require"
echo "   Database: $DB_HOST"

# ============================================
# 4. Build API Image (in ACR)
# ============================================
echo ""
echo ">>> Step 4: Building API image..."
az acr build \
    --registry "$ACR_NAME" \
    --image api:latest \
    --file docker/api/Dockerfile.prod \
    . \
    --no-logs

echo "   API image: $ACR_LOGIN_SERVER/api:latest"

# ============================================
# 5. Container Apps Environment
# ============================================
echo ""
echo ">>> Step 5: Creating Container Apps environment..."
az containerapp env create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CONTAINER_ENV_NAME" \
    --location "$LOCATION" \
    --output none

# ============================================
# 6. Deploy API Container App
# ============================================
echo ""
echo ">>> Step 6: Deploying API..."
az containerapp create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$API_APP_NAME" \
    --environment "$CONTAINER_ENV_NAME" \
    --image "$ACR_LOGIN_SERVER/api:latest" \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --target-port 8000 \
    --ingress external \
    --min-replicas 0 \
    --max-replicas 1 \
    --cpu 0.5 \
    --memory 1.0Gi \
    --env-vars \
        "DATABASE_URL=secretref:database-url" \
        "AZURE_OPENAI_ENDPOINT=secretref:azure-openai-endpoint" \
        "AZURE_OPENAI_API_KEY=secretref:azure-openai-key" \
        "JWT_SECRET=secretref:jwt-secret" \
        "API_RELOAD=false" \
        "DEBUG=false" \
    --secrets \
        "database-url=$DATABASE_URL" \
        "azure-openai-endpoint=https://${OPENAI_RESOURCE_NAME}.openai.azure.com/" \
        "azure-openai-key=$(az cognitiveservices account keys list --name $OPENAI_RESOURCE_NAME --resource-group $RESOURCE_GROUP --query key1 -o tsv)" \
        "jwt-secret=$JWT_SECRET" \
    --output none

API_FQDN=$(az containerapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$API_APP_NAME" \
    --query "properties.configuration.ingress.fqdn" -o tsv)
API_URL="https://${API_FQDN}"
echo "   API: $API_URL"

# ============================================
# 7. Build Web Image (with API URL baked in)
# ============================================
echo ""
echo ">>> Step 7: Building Web image..."
az acr build \
    --registry "$ACR_NAME" \
    --image web:latest \
    --file docker/web/Dockerfile.prod \
    --build-arg "NEXT_PUBLIC_API_URL=$API_URL" \
    . \
    --no-logs

echo "   Web image: $ACR_LOGIN_SERVER/web:latest"

# ============================================
# 8. Deploy Web Container App
# ============================================
echo ""
echo ">>> Step 8: Deploying Web..."
az containerapp create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEB_APP_NAME" \
    --environment "$CONTAINER_ENV_NAME" \
    --image "$ACR_LOGIN_SERVER/web:latest" \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --target-port 3000 \
    --ingress external \
    --min-replicas 0 \
    --max-replicas 1 \
    --cpu 0.25 \
    --memory 0.5Gi \
    --output none

WEB_FQDN=$(az containerapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEB_APP_NAME" \
    --query "properties.configuration.ingress.fqdn" -o tsv)
WEB_URL="https://${WEB_FQDN}"
echo "   Web: $WEB_URL"

# ============================================
# 9. Update API CORS
# ============================================
echo ""
echo ">>> Step 9: Updating CORS..."
az containerapp update \
    --resource-group "$RESOURCE_GROUP" \
    --name "$API_APP_NAME" \
    --set-env-vars "CORS_ORIGINS=[\"${WEB_URL}\"]" \
    --output none
echo "   CORS: $WEB_URL"

# ============================================
# Summary
# ============================================
echo ""
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
echo ""
echo "  API:  $API_URL"
echo "  Web:  $WEB_URL"
echo ""
echo "  DB Password:  (stored as secret)"
echo "  JWT Secret:   (stored as secret)"
echo ""
echo "Next steps:"
echo "  1. Seed DB:"
echo "     az containerapp exec -g $RESOURCE_GROUP -n $API_APP_NAME --command 'python -m seed.seed_db'"
echo "  2. Test:  curl $API_URL/api/v1/health"
echo "  3. Open:  $WEB_URL"
echo ""
echo "Tear down: az group delete --name $RESOURCE_GROUP --yes --no-wait"
