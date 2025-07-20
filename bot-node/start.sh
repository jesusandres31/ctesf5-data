#!/bin/bash

# Este script inicia el bot de Telegram
cd $(dirname $0)

# Verificar que exista el archivo .env
if [ ! -f .env ]; then
  echo "⚠️ El archivo .env no existe. Creando uno de ejemplo..."
  echo "TELEGRAM_TOKEN=your_telegram_token" > .env
  echo "GROQ_API_KEY=your_groq_api_key" >> .env
  echo "DB_HOST=localhost" >> .env
  echo "DB_PORT=5432" >> .env
  echo "DB_NAME=ctesf5" >> .env
  echo "DB_USER=postgres" >> .env
  echo "DB_PASSWORD=root" >> .env
  echo "❌ Por favor, edita el archivo .env con tus credenciales antes de continuar."
  exit 1
fi

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  pnpm install
fi

# Compilar el código TypeScript
echo "🔨 Compilando el código..."
pnpm build

# Iniciar el bot
echo "🤖 Iniciando el bot..."
pnpm start
