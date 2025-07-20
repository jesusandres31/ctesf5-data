@echo off
REM Este script inicia el bot de Telegram en Windows

REM Verificar que exista el archivo .env
IF NOT EXIST .env (
  echo ⚠️ El archivo .env no existe. Creando uno de ejemplo...
  echo TELEGRAM_TOKEN=your_telegram_token > .env
  echo GROQ_API_KEY=your_groq_api_key >> .env
  echo DB_HOST=localhost >> .env
  echo DB_PORT=5432 >> .env
  echo DB_NAME=ctesf5 >> .env
  echo DB_USER=postgres >> .env
  echo DB_PASSWORD=root >> .env
  echo ❌ Por favor, edita el archivo .env con tus credenciales antes de continuar.
  exit /b 1
)

REM Instalar dependencias si no están instaladas
IF NOT EXIST node_modules (
  echo 📦 Instalando dependencias...
  pnpm install
)

REM Compilar el código TypeScript
echo 🔨 Compilando el código...
pnpm build

REM Iniciar el bot
echo 🤖 Iniciando el bot...
pnpm start
