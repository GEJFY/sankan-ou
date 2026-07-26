#!/bin/bash
# PostgreSQL Flexible Server の起動/停止を切り替えるヘルパースクリプト
#
# Azure Database for PostgreSQL Flexible Server は稼働中(hourly)課金のため、
# 使わない時間帯は停止しておくことで固定費をストレージ分(月額約$2-3)まで下げられる。
# ただし Azure 側の仕様で、停止後 7日 経過すると自動的に再起動される。
#
# 使い方:
#   ./azure-db.sh stop    # 使わない間はこれで固定費を最小化
#   ./azure-db.sh start   # スマホ等から試す前にこれで再開 (起動に数分かかる)
#   ./azure-db.sh status  # 現在の状態を確認
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-rg-sankanou}"
DB_SERVER_NAME="${DB_SERVER_NAME:-sankanou-db}"

ACTION="${1:-}"

case "$ACTION" in
    stop)
        echo ">>> Stopping PostgreSQL Flexible Server '$DB_SERVER_NAME'..."
        az postgres flexible-server stop \
            --resource-group "$RESOURCE_GROUP" \
            --name "$DB_SERVER_NAME"
        echo "Stopped. Compute billing paused (storage billing continues, ~\$2-3/month)."
        echo "Note: Azure will auto-restart this server after 7 days if left stopped."
        ;;
    start)
        echo ">>> Starting PostgreSQL Flexible Server '$DB_SERVER_NAME'..."
        az postgres flexible-server start \
            --resource-group "$RESOURCE_GROUP" \
            --name "$DB_SERVER_NAME"
        echo "Started. It may take a minute or two before the API can connect successfully."
        ;;
    status)
        az postgres flexible-server show \
            --resource-group "$RESOURCE_GROUP" \
            --name "$DB_SERVER_NAME" \
            --query "{name:name, state:state}" \
            --output table
        ;;
    *)
        echo "Usage: $0 {stop|start|status}"
        exit 1
        ;;
esac
