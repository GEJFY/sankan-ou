#!/bin/bash
set -euo pipefail

# ============================================
# Configuration
# ============================================
RESOURCE_GROUP="rg-sankanou"
LOCATION="japaneast"
ACR_NAME="sankanouacr"
CONTAINER_ENV_NAME="sankanou-env"
API_APP_NAME="sankanou-api"
WEB_APP_NAME="sankanou-web"

# シークレット生成 (環境変数で上書き可能)
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32)}"
AI_RESOURCE_NAME="sankanou-ai"
AI_RESOURCE_LOCATION="eastus2"  # AIServicesはEast US 2で利用可能 (Claude対応リージョン)

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
# 3. Database (Neon - free serverless Postgres)
# ============================================
# Azure Database for PostgreSQL Flexible Serverは常時起動の時間課金(月額約$15-18)が
# 避けられないため、代わりにNeon(https://neon.tech)の無料枠を使う。Neonは標準的な
# Postgresプロトコルで、pgvector拡張にも対応しており、本アプリのコード変更は不要。
echo ""
echo ">>> Step 3: Configuring database (Neon)..."
if [ -z "${NEON_DATABASE_URL:-}" ]; then
    echo "ERROR: NEON_DATABASE_URL is not set." >&2
    echo "" >&2
    echo "Set up a free Neon Postgres database first:" >&2
    echo "  1. Sign up at https://neon.tech (free tier)" >&2
    echo "  2. Create a project (nearest region to Japan: 'ap-southeast-1' / Singapore)" >&2
    echo "  3. In the Neon SQL Editor, run: CREATE EXTENSION IF NOT EXISTS vector;" >&2
    echo "  4. Copy the connection string from the Neon dashboard" >&2
    echo "  5. Re-run:" >&2
    echo "     export NEON_DATABASE_URL='postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require'" >&2
    echo "     ./deploy.sh" >&2
    exit 1
fi

# NeonのURLスキーム(postgresql:// / postgres://)をasyncpgドライバ指定に変換し、
# sslmode=require (libpq形式) をこのアプリが期待する ssl=require (asyncpg形式) に揃える。
# channel_binding=require はasyncpgが認識せず接続エラーになるため除去する。
DATABASE_URL="${NEON_DATABASE_URL/#postgresql:\/\//postgresql+asyncpg://}"
DATABASE_URL="${DATABASE_URL/#postgres:\/\//postgresql+asyncpg://}"
DATABASE_URL="${DATABASE_URL/sslmode=require/ssl=require}"
DATABASE_URL="${DATABASE_URL/&channel_binding=require/}"
DATABASE_URL="${DATABASE_URL/channel_binding=require&/}"
DATABASE_URL="${DATABASE_URL/channel_binding=require/}"
if [[ "$DATABASE_URL" != *"ssl="* ]]; then
    if [[ "$DATABASE_URL" == *"?"* ]]; then
        DATABASE_URL="${DATABASE_URL}&ssl=require"
    else
        DATABASE_URL="${DATABASE_URL}?ssl=require"
    fi
fi
echo "   Using Neon database (from NEON_DATABASE_URL)"

# ============================================
# 4. Azure AI Foundry (AIServices) リソース
# ============================================
echo ""
echo ">>> Step 4: Creating AI Services resource..."
existing_ai=$(az cognitiveservices account show --resource-group "$RESOURCE_GROUP" --name "$AI_RESOURCE_NAME" --query name -o tsv 2>/dev/null || true)
if [ -n "$existing_ai" ]; then
    echo "   AI Services resource already exists."
else
    az cognitiveservices account create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$AI_RESOURCE_NAME" \
        --kind AIServices \
        --sku S0 \
        --location "$AI_RESOURCE_LOCATION" \
        --custom-domain "$AI_RESOURCE_NAME" \
        --output none

    echo "   Deploying GPT-5-mini..."
    az cognitiveservices account deployment create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$AI_RESOURCE_NAME" \
        --deployment-name "gpt-5-mini" \
        --model-name "gpt-5-mini" \
        --model-version "2025-08-07" \
        --model-format OpenAI \
        --sku-name "GlobalStandard" \
        --sku-capacity 10 \
        --output none

    echo "   Deploying GPT-5-nano..."
    az cognitiveservices account deployment create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$AI_RESOURCE_NAME" \
        --deployment-name "gpt-5-nano" \
        --model-name "gpt-5-nano" \
        --model-version "2025-08-07" \
        --model-format OpenAI \
        --sku-name "GlobalStandard" \
        --sku-capacity 10 \
        --output none

    echo "   Deploying GPT-5.2-chat..."
    az cognitiveservices account deployment create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$AI_RESOURCE_NAME" \
        --deployment-name "gpt-5.2-chat" \
        --model-name "gpt-5.2-chat" \
        --model-version "2025-12-11" \
        --model-format OpenAI \
        --sku-name "GlobalStandard" \
        --sku-capacity 10 \
        --output none
fi

# ============================================
# 5. Build API Image (in ACR)
# ============================================
echo ""
echo ">>> Step 5: Building API image..."
az acr build \
    --registry "$ACR_NAME" \
    --image api:latest \
    --file docker/api/Dockerfile.prod \
    . \
    --no-logs

echo "   API image: $ACR_LOGIN_SERVER/api:latest"

# ============================================
# 6. Container Apps Environment
# ============================================
echo ""
echo ">>> Step 6: Creating Container Apps environment..."
# コスト最適化: --logs-destination none でLog Analyticsワークスペースの自動作成を回避する。
# (デフォルトのままだとログ取り込み量に応じた課金が常時発生する。ライブログは
#  `az containerapp logs show` で引き続き確認可能。過去ログの検索が必要になった場合のみ
#  Log Analyticsワークスペースを別途アタッチすること)
az containerapp env create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CONTAINER_ENV_NAME" \
    --location "$LOCATION" \
    --logs-destination none \
    --output none

# ============================================
# 7. Deploy API Container App
# ============================================
echo ""
echo ">>> Step 7: Deploying API..."
AI_KEY=$(az cognitiveservices account keys list --name "$AI_RESOURCE_NAME" --resource-group "$RESOURCE_GROUP" --query key1 -o tsv)
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
        "AZURE_FOUNDRY_ENDPOINT=secretref:azure-foundry-endpoint" \
        "AZURE_FOUNDRY_API_KEY=secretref:azure-foundry-key" \
        "JWT_SECRET=secretref:jwt-secret" \
        "API_RELOAD=false" \
        "DEBUG=false" \
    --secrets \
        "database-url=$DATABASE_URL" \
        "azure-foundry-endpoint=https://${AI_RESOURCE_NAME}.cognitiveservices.azure.com/" \
        "azure-foundry-key=$AI_KEY" \
        "jwt-secret=$JWT_SECRET" \
    --output none

API_FQDN=$(az containerapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$API_APP_NAME" \
    --query "properties.configuration.ingress.fqdn" -o tsv)
API_URL="https://${API_FQDN}"
echo "   API: $API_URL"

# ============================================
# 8. Build Web Image (with API URL baked in)
# ============================================
echo ""
echo ">>> Step 8: Building Web image..."
az acr build \
    --registry "$ACR_NAME" \
    --image web:latest \
    --file docker/web/Dockerfile.prod \
    --build-arg "NEXT_PUBLIC_API_URL=$API_URL" \
    . \
    --no-logs

echo "   Web image: $ACR_LOGIN_SERVER/web:latest"

# ============================================
# 9. Deploy Web Container App
# ============================================
echo ""
echo ">>> Step 9: Deploying Web..."
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
# 10. Update API CORS
# ============================================
echo ""
echo ">>> Step 10: Updating CORS..."
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
echo "  DB:           Neon (see NEON_DATABASE_URL)"
echo "  JWT Secret:   (stored as secret)"
echo ""
echo "Next steps:"
echo "  1. Seed DB:"
echo "     az containerapp exec -g $RESOURCE_GROUP -n $API_APP_NAME --command 'python -m seed.seed_db'"
echo "  2. Test:  curl $API_URL/api/v1/health"
echo "  3. Open:  $WEB_URL"
echo ""
echo "Cost note: Container Apps + Neon(無料枠)構成のため、アイドル時はほぼ\$0。"
echo "固定費はACR Basic(月額約\$5)のみです。DBの起動/停止操作は不要(Neonが自動スケール)。"
echo ""
echo "Tear down: az group delete --name $RESOURCE_GROUP --yes --no-wait"
echo "           (Neonのプロジェクトは別途 neon.tech のダッシュボードから削除してください)"
