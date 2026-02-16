# Azure デプロイガイド

## 概要

GRC Triple Crown は以下の Azure リソースで構成されます。

| リソース | 名前 | リージョン | 用途 |
|---------|------|-----------|------|
| Resource Group | `rg-sankanou` | Japan East | 全リソースの格納先 |
| Container Registry | `sankanouacr` | Japan East | Docker イメージ |
| Container App | `sankanou-api` | Japan East | FastAPI バックエンド |
| Container App | `sankanou-web` | Japan East | Next.js フロントエンド |
| PostgreSQL Flexible Server | `sankanou-db` | Japan East | データベース |
| AI Services | `sankanou-ai` | East US 2 | GPT-5 / Claude |

## 前提条件

- Azure CLI (`az`) がインストール済み
- `az login` でログイン済み
- サブスクリプションが選択済み

## 自動デプロイ

### ワンコマンドデプロイ

```bash
# Linux/macOS
./deploy.sh

# Windows (PowerShell)
.\deploy.ps1
```

スクリプトは以下を自動実行します:

1. リソースグループ作成
2. ACR 作成
3. PostgreSQL Flexible Server 作成 + pgvector 有効化
4. Azure AI Services (AIServices) 作成 + GPT-5 モデルデプロイ
5. API イメージビルド (ACR Task)
6. Container Apps 環境作成
7. API Container App デプロイ
8. Web イメージビルド (ACR Task)
9. Web Container App デプロイ
10. CORS 設定

### デプロイ後の手順

```bash
# 1. DB シード投入
az containerapp exec -g rg-sankanou -n sankanou-api \
  --command 'python -m seed.seed_db'

# 2. ヘルスチェック
curl https://sankanou-api.<fqdn>/api/v1/health

# 3. Web アクセス
# https://sankanou-web.<fqdn>
```

## 手動デプロイ（ステップバイステップ）

### 1. リソースグループ

```bash
az group create --name rg-sankanou --location japaneast
```

### 2. Container Registry

```bash
az acr create \
  --resource-group rg-sankanou \
  --name sankanouacr \
  --sku Basic \
  --admin-enabled true
```

### 3. PostgreSQL

```bash
# サーバー作成
az postgres flexible-server create \
  --resource-group rg-sankanou \
  --name sankanou-db \
  --location japaneast \
  --admin-user sankanouadmin \
  --admin-password <PASSWORD> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16

# Azure サービスからのアクセス許可
az postgres flexible-server firewall-rule create \
  --resource-group rg-sankanou \
  --name sankanou-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# pgvector 拡張有効化
az postgres flexible-server parameter set \
  --resource-group rg-sankanou \
  --server-name sankanou-db \
  --name azure.extensions \
  --value "vector,uuid-ossp"

# DB 作成
az postgres flexible-server db create \
  --resource-group rg-sankanou \
  --server-name sankanou-db \
  --database-name sankanou
```

### 4. Azure AI Services (GPT-5)

```bash
# AIServices リソース作成 (East US 2 = Claude 対応リージョン)
az cognitiveservices account create \
  --resource-group rg-sankanou \
  --name sankanou-ai \
  --kind AIServices \
  --sku S0 \
  --location eastus2 \
  --custom-domain sankanou-ai

# GPT-5-mini デプロイ (生成用)
az cognitiveservices account deployment create \
  --resource-group rg-sankanou \
  --name sankanou-ai \
  --deployment-name gpt-5-mini \
  --model-name gpt-5-mini \
  --model-version 2025-08-07 \
  --model-format OpenAI \
  --sku-name GlobalStandard \
  --sku-capacity 10

# GPT-5-nano デプロイ (チャット用)
az cognitiveservices account deployment create \
  --resource-group rg-sankanou \
  --name sankanou-ai \
  --deployment-name gpt-5-nano \
  --model-name gpt-5-nano \
  --model-version 2025-08-07 \
  --model-format OpenAI \
  --sku-name GlobalStandard \
  --sku-capacity 10

# GPT-5.2-chat デプロイ (フラグシップ)
az cognitiveservices account deployment create \
  --resource-group rg-sankanou \
  --name sankanou-ai \
  --deployment-name gpt-5.2-chat \
  --model-name gpt-5.2-chat \
  --model-version 2025-12-11 \
  --model-format OpenAI \
  --sku-name GlobalStandard \
  --sku-capacity 10
```

### 5. Container Apps

```bash
# 環境作成
az containerapp env create \
  --resource-group rg-sankanou \
  --name sankanou-env \
  --location japaneast

# API イメージビルド
az acr build --registry sankanouacr \
  --image api:latest \
  --file docker/api/Dockerfile.prod .

# API デプロイ
AI_KEY=$(az cognitiveservices account keys list \
  --name sankanou-ai --resource-group rg-sankanou \
  --query key1 -o tsv)

az containerapp create \
  --resource-group rg-sankanou \
  --name sankanou-api \
  --environment sankanou-env \
  --image sankanouacr.azurecr.io/api:latest \
  --target-port 8000 \
  --ingress external \
  --min-replicas 0 --max-replicas 1 \
  --cpu 0.5 --memory 1.0Gi \
  --env-vars \
    "DATABASE_URL=secretref:database-url" \
    "AZURE_FOUNDRY_ENDPOINT=secretref:azure-foundry-endpoint" \
    "AZURE_FOUNDRY_API_KEY=secretref:azure-foundry-key" \
    "JWT_SECRET=secretref:jwt-secret" \
  --secrets \
    "database-url=<DATABASE_URL>" \
    "azure-foundry-endpoint=https://sankanou-ai.cognitiveservices.azure.com/" \
    "azure-foundry-key=$AI_KEY" \
    "jwt-secret=<JWT_SECRET>"
```

## CI/CD (GitHub Actions)

main ブランチへのプッシュ時に自動デプロイが実行されます。

### 必要な GitHub Secrets

| Secret Name | 説明 | 取得方法 |
|-------------|------|---------|
| `AZURE_CREDENTIALS` | サービスプリンシパル JSON | 下記参照 |

### サービスプリンシパル作成

```bash
az ad sp create-for-rbac \
  --name "github-actions-sankanou" \
  --role contributor \
  --scopes "/subscriptions/<SUB_ID>/resourceGroups/rg-sankanou" \
  --sdk-auth
```

出力される JSON を GitHub リポジトリの Settings → Secrets → `AZURE_CREDENTIALS` に登録。

### CD トリガー条件

`apps/api/**` または `docker/api/**` の変更が main にプッシュされたとき:

1. ACR でイメージをビルド（git SHA タグ + latest タグ）
2. Container App に新リビジョンをデプロイ

## 環境変数一覧

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL 接続文字列 | `postgresql+asyncpg://user:pass@host:5432/db?ssl=require` |
| `AZURE_FOUNDRY_ENDPOINT` | AI Foundry エンドポイント | `https://sankanou-ai.cognitiveservices.azure.com/` |
| `AZURE_FOUNDRY_API_KEY` | AI Foundry API キー | (Azure Portal から取得) |
| `AZURE_FOUNDRY_API_VERSION` | API バージョン | `2024-12-01-preview` |
| `JWT_SECRET` | JWT 署名シークレット | (ランダム文字列) |
| `LLM_MODEL_GENERATION` | 生成用モデル | `gpt-5-mini` |
| `LLM_MODEL_CHAT` | チャット用モデル | `gpt-5-nano` |
| `CORS_ORIGINS` | CORS 許可オリジン | `["https://sankanou-web.xxx.azurecontainerapps.io"]` |

## トラブルシューティング

### AI Tutor が空の応答を返す

1. **環境変数確認**: Container App に `AZURE_FOUNDRY_ENDPOINT` と `AZURE_FOUNDRY_API_KEY` が設定されているか
2. **GPT-5 パラメータ**: `max_completion_tokens`（`max_tokens` ではない）、`temperature` 省略
3. **reasoning tokens**: `max_completion_tokens` が小さすぎると推論トークンで消費され出力が空になる（16384 推奨）

### DB 接続エラー

1. ファイアウォールルール `AllowAzureServices` (0.0.0.0) が設定されているか
2. `DATABASE_URL` に `?ssl=require` が含まれているか
3. PostgreSQL サーバーが `Ready` 状態か: `az postgres flexible-server show -g rg-sankanou -n sankanou-db --query state`

### Container App が起動しない

1. `start.sh` の改行コードが LF であること（`.gitattributes` で強制）
2. ACR イメージが最新か: `az acr repository show-tags -n sankanouacr --repository api`
3. 新リビジョン作成: `az containerapp update --name sankanou-api -g rg-sankanou --image sankanouacr.azurecr.io/api:latest --revision-suffix <suffix>`

## リソース削除

```bash
# 全リソースを削除（注意: データも削除されます）
az group delete --name rg-sankanou --yes --no-wait
```
