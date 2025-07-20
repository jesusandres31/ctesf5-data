import { startTelegramBot } from './libs/telegram';
import { testConnection } from './libs/psql';
import { setupBot } from './helper/telegram';

export async function startBotApp() {
  try {
    // Probar la conexión a la base de datos
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error(
        '❌ Error de conexión a la base de datos. La aplicación se cerrará.',
      );
      process.exit(1);
    }

    // Inicializar el bot de Telegram
    setupBot();
    startTelegramBot();

    console.log('✅ Aplicación iniciada correctamente');
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1);
  }
}
