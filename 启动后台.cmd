@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 22 或 24，然后重新双击本文件。
  pause
  exit /b 1
)
if not exist "node_modules\express\package.json" (
  echo 首次启动，正在安装系统依赖，请保持网络连接。
  call npm ci --no-fund
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)
node --env-file-if-exists=.env scripts/start-local.js
pause
