# Bot de Telegram con RAG para Base de Datos CTESF5

Este bot de Telegram utiliza la tecnología RAG (Retrieval Augmented Generation) con Groq AI para responder a preguntas utilizando datos de una base de datos PostgreSQL.

## Características

- 🤖 Bot de Telegram que responde a preguntas en lenguaje natural
- 📊 Consulta base de datos PostgreSQL para obtener información
- 🔍 Usa RAG (Retrieval Augmented Generation) con Groq AI para generar respuestas precisas
- 🧠 Enfoque de dos pasos: primero genera SQL, luego ejecuta y responde
- 🛡️ Manejo robusto de errores y sanitización de Markdown

## Requisitos

- Node.js >= 18
- pnpm (o npm/yarn)
- Base de datos PostgreSQL en ejecución
- Variables de entorno en un archivo `.env` en la raíz del proyecto:

```
TELEGRAM_TOKEN=tu_token_de_telegram
GROQ_API_KEY=tu_clave_api_de_groq
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ctesf5
DB_USER=postgres
DB_PASSWORD=tu_contraseña
```

## Estructura del proyecto

```
bot-node/
├── src/
│   ├── app.ts              # Configuración de la aplicación
│   ├── index.ts            # Punto de entrada principal
│   ├── config/             # Configuración de variables de entorno
│   ├── helper/             # Funciones auxiliares para telegram, groq y base de datos
│   ├── libs/               # Bibliotecas para conexión a servicios
│   ├── db/                 # Archivo de esquema de base de datos
│   └── utils/              # Utilidades generales
├── start.cmd               # Script de inicio para Windows
├── start.sh                # Script de inicio para Linux/Mac
└── package.json            # Dependencias y scripts
```

## Instalación

```bash
# Instalar dependencias
pnpm install

# Compilar el código TypeScript
pnpm build

# Iniciar el bot
pnpm start
```

O simplemente ejecuta:

```bash
# En Windows
start.cmd

# En Linux/Mac
./start.sh
```

## Ejecución local

```sh
pnpm start
# o
node dist/index.js
```

## Uso

1. Inicia una conversación con tu bot en Telegram
2. Envía preguntas sobre los datos almacenados en la base de datos
3. El bot:
   - Generará una consulta SQL basada en tu pregunta
   - Ejecutará la consulta en la base de datos
   - Analizará los resultados
   - Te responderá en lenguaje natural con la información solicitada

## Mantenimiento

- Para probar la conexión a la base de datos: `pnpm test-db`
- Para ejecutar en modo desarrollo: `pnpm dev`
- Para reconstruir el proyecto: `pnpm rebuild`

## Ejemplo de uso

Usuario: "¿Cuántas canchas deportivas hay en total?"

Bot:

```
En total hay 8 canchas deportivas registradas en el sistema.

Las canchas están distribuidas en las siguientes ubicaciones:
- Club Central: 3 canchas
- Sede Norte: 2 canchas
- Complejo Sur: 3 canchas
```

## Despliegue en producción con PM2

1. Instala pm2 globalmente (si no lo tienes):

   ```sh
   pnpm add -g pm2
   # o
   npm install -g pm2
   ```

2. Compila el proyecto:

   ```sh
   pnpm build
   # o
   tsc
   ```

3. Inicia el bot con pm2:

   ```sh
   pm2 start dist/index.js --name ctesf5-bot
   ```

4. Comandos útiles de pm2:
   - Listar procesos: `pm2 ls`
   - Ver logs: `pm2 logs ctesf5-bot`
   - Reiniciar: `pm2 restart ctesf5-bot`
   - Detener: `pm2 stop ctesf5-bot`
   - Eliminar: `pm2 delete ctesf5-bot`
   - Configurar inicio automático: `pm2 startup` y seguir instrucciones
   - Guardar configuración: `pm2 save`
