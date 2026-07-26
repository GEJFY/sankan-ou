# PostgreSQL Flexible Server の起動/停止を切り替えるヘルパースクリプト (Windows)
#
# 使い方:
#   .\azure-db.ps1 stop    # 使わない間はこれで固定費を最小化 (ストレージ分のみ、月額約$2-3)
#   .\azure-db.ps1 start   # スマホ等から試す前にこれで再開 (起動に数分かかる)
#   .\azure-db.ps1 status  # 現在の状態を確認

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("stop", "start", "status")]
    [string]$Action
)

$RESOURCE_GROUP = if ($env:RESOURCE_GROUP) { $env:RESOURCE_GROUP } else { "rg-sankanou" }
$DB_SERVER_NAME = if ($env:DB_SERVER_NAME) { $env:DB_SERVER_NAME } else { "sankanou-db" }

switch ($Action) {
    "stop" {
        Write-Host ">>> Stopping PostgreSQL Flexible Server '$DB_SERVER_NAME'..."
        az postgres flexible-server stop --resource-group $RESOURCE_GROUP --name $DB_SERVER_NAME
        Write-Host "Stopped. Compute billing paused (storage billing continues, ~`$2-3/month)."
        Write-Host "Note: Azure will auto-restart this server after 7 days if left stopped."
    }
    "start" {
        Write-Host ">>> Starting PostgreSQL Flexible Server '$DB_SERVER_NAME'..."
        az postgres flexible-server start --resource-group $RESOURCE_GROUP --name $DB_SERVER_NAME
        Write-Host "Started. It may take a minute or two before the API can connect successfully."
    }
    "status" {
        az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $DB_SERVER_NAME --query "{name:name, state:state}" --output table
    }
}
