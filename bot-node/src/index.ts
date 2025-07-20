import 'dotenv/config';

import { startBotApp } from './app';

// Iniciar la aplicación y manejar errores no capturados
startBotApp().catch(error => {
  console.error('❌ Error no manejado en la aplicación:', error);
  process.exit(1);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n👋 Deteniendo la aplicación...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Deteniendo la aplicación...');
  process.exit(0);
});
