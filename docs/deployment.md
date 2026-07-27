# Azure デプロイガイド

## 概要

GRC Triple Crown は以下の Azure リソースで構成されます。

| リソース | 名前 | リージョン | 用途 |
|---------|------|-----------|------|
| Resource Group | `rg-sankanou` | Japan East | 全リソースの格納先 |
| Container Registry | `sankanouacr` | Japan East | Docker イメージ |
| Container App | `sankanou-api` | Japan East | FastAPI バックエンド |
| Container App | `sankanou-web` | Japan East | Next.js フロントエンド |
| AI Services | `sankanou-ai` | East US 2 | GPT-5 / Claude |
| Neon (Azure外) | 任意のプロジェクト名 | ap-southeast-1 推奨 | データベース (PostgreSQL + pgvector) |

データベースはAzure Database for PostgreSQL Flexible Serverではなく、[Neon](https://neon.tech)
(無料枠のあるサーバーレスPostgres)を使う構成になっています。理由は下記コスト最適化の項を参照。

## 前提条件

- Azure CLI (`az`) がインストール済み
- `az login` でログイン済み
- サブスクリプションが選択済み(サブスクリプションを切り替えた/新規契約した場合は下記を実行)
- Neonアカウント作成済み・`NEON_DATABASE_URL` を取得済み(下記「Neonのセットアップ」参照)

```bash
az account list --output table          # 利用可能なサブスクリプション一覧
az account set --subscription "<サブスクリプション名 or ID>"
az account show --output table          # 選択されていることを確認
```

`rg-sankanou` 等のリソース名は前提として**存在しない**（＝新規サブスクリプションでは何もない状態）として
`./deploy.sh` はゼロから全リソースを作成します。`deploy.ps1` は既存リソースへの追加デプロイ専用
（RG/ACRが存在する前提）なので、新規サブスクリプションでのフル構築には `deploy.sh` を使ってください
（Windowsの場合は Git Bash / WSL 経由で実行）。

## Neonのセットアップ

1. [https://neon.tech](https://neon.tech) でサインアップ(無料枠で十分)
2. プロジェクトを作成(リージョンは日本から最も近い `ap-southeast-1` / Singapore を推奨)
3. Neonダッシュボードの SQL Editor で以下を実行し、pgvector拡張を有効化:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. ダッシュボードの「Connection Details」から接続文字列をコピー
   (`postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` の形式)
5. 環境変数として設定してから `deploy.sh`/`deploy.ps1` を実行:
   ```bash
   export NEON_DATABASE_URL='postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require'
   ./deploy.sh
   ```
   スクリプト内でこのアプリが使う `postgresql+asyncpg://...?ssl=require` 形式に自動変換されます。

## コスト最適化について

このアプリの月額費用の内訳はおおよそ以下の通りです（アイドル時 = ほぼアクセスがない状態）:

| リソース | アイドル時の月額目安 | 備考 |
|---------|---------------------|------|
| Container Apps (API/Web) | ほぼ $0 | `min-replicas=0` でスケールtoゼロ。実際に使った分だけ課金され、少量アクセスなら無料枠内に収まることが多い |
| Neon (データベース) | $0 | 無料枠のサーバーレスPostgres。使わない間は自動でスケールtoゼロし、次回接続時に自動で復帰する（手動での起動/停止操作は不要） |
| Container Registry (Basic) | 約 $5 | 常時起動の固定費（ACR Basicの最低ライン） |
| Log Analytics | $0 | `deploy.sh`で`--logs-destination none`にして無効化済み（ライブログは`az containerapp logs show`で引き続き閲覧可） |
| AI Services (GPT-5等) | 実使用分のみ | トークン課金、固定費なし |

→ **固定費はACR Basicの約$5/月のみ**になります。以前はAzure Database for PostgreSQL Flexible Server
(常時起動の時間課金、月額約$15-18)が固定費の大半を占めていましたが、Neonへの切り替えでほぼ解消されました。
体感で「Container Appsが高い」と感じる場合は大抵`min-replicas`が0になっていない
（`az containerapp show`で確認）ことが原因です。

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

### 3. データベース (Neon)

Azureリソースではなく、[Neon](https://neon.tech)でプロジェクトを作成し、pgvector拡張を
有効化してから接続文字列を控えておく（詳細は上記「Neonのセットアップ」参照）。

```bash
export NEON_DATABASE_URL='postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require'
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

CD (`.github/workflows/cd.yml`) は CI (`.github/workflows/ci.yml`) の完了イベント
(`workflow_run`) をトリガーとし、**CI が `main` へのプッシュに対して成功した場合のみ**発火する
（`push` イベントを直接トリガーにしていた旧構成だと CI の結果を待たずにデプロイされてしまうため）。

CI が成功したコミットと、その1つ前のコミットとの差分を見て、変更されたパスに応じて以下を実行する:

- **deploy-api**: `apps/api/**` または `docker/api/**` に変更がある場合
  1. ACR で API イメージをビルド（git SHA タグ + latest タグ）
  2. `sankanou-api` Container App に新リビジョンをデプロイ
- **deploy-web**: `apps/web/**` または `docker/web/**` に変更がある場合
  1. 現在の `sankanou-api` の URL を取得し、`NEXT_PUBLIC_API_URL` ビルド引数として渡して
     ACR で Web イメージをビルド（git SHA タグ + latest タグ）
  2. `sankanou-web` Container App に新リビジョンをデプロイ

両方に変更があれば両方のジョブが並行して実行される。どちらの変更も無ければ、CI は動くが
デプロイジョブはスキップされる。

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

1. `NEON_DATABASE_URL` が正しくコピーされているか（Neonダッシュボードの Connection Details）
2. `DATABASE_URL` に `?ssl=require` が含まれているか（`channel_binding=require` はasyncpgが認識せずエラーになるため除去されているか）
3. Neonプロジェクトが一時停止(idle)から復帰中でないか（初回接続は数百ms〜数秒のコールドスタートが発生することがある）

### Container App が起動しない

1. `start.sh` の改行コードが LF であること（`.gitattributes` で強制）
2. ACR イメージが最新か: `az acr repository show-tags -n sankanouacr --repository api`
3. 新リビジョン作成: `az containerapp update --name sankanou-api -g rg-sankanou --image sankanouacr.azurecr.io/api:latest --revision-suffix <suffix>`

## リソース削除

```bash
# 全リソースを削除（注意: データも削除されます）
az group delete --name rg-sankanou --yes --no-wait
```
