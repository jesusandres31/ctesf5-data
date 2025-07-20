import { Pool } from 'pg';
import { DB_CONFIG } from '../config';

console.log('📊 Intentando conectar a la base de datos existente:', {
  host: DB_CONFIG.host,
  port: DB_CONFIG.port,
  database: DB_CONFIG.database, // Se espera que esta base de datos ya exista
  user: DB_CONFIG.user,
  // No mostramos la contraseña por seguridad
});

// Crear una instancia del pool de conexiones
const pool = new Pool({
  host: DB_CONFIG.host,
  port: DB_CONFIG.port,
  database: DB_CONFIG.database, // Intentamos conectar a ctesf5
  user: DB_CONFIG.user,
  password: DB_CONFIG.password,
  // Agregamos opciones adicionales para mejorar la conexión
  connectionTimeoutMillis: 5000, // 5 segundos de timeout
  idleTimeoutMillis: 30000, // 30 segundos de timeout en inactividad
  max: 10, // máximo de 10 clientes en el pool
});

// Verificar la conexión a la base de datos
export const testConnection = async (): Promise<boolean> => {
  try {
    // Intentamos conectar con el pool configurado
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');

    // Verificamos que estamos conectados a la base de datos correcta
    const dbResult = await client.query('SELECT current_database() as db_name');
    const currentDb = dbResult.rows[0].db_name;
    console.log(`🗄️ Base de datos actual: ${currentDb}`);

    if (currentDb !== DB_CONFIG.database) {
      console.error(
        `❌ Error: Conectado a la base de datos '${currentDb}' en lugar de '${DB_CONFIG.database}'`,
      );
      console.error(
        `Por favor verifica la configuración de conexión a la base de datos`,
      );
      client.release();
      return false;
    }

    client.release();

    // Ya no consultamos el esquema de la base de datos directamente
    console.log('✅ Usando esquema definido localmente en schema.txt');

    return true;
  } catch (error: any) {
    console.error(`❌ Error al conectar a PostgreSQL: ${error.message}`);
    console.error('Detalles:', error);

    console.log(`\n⚠️ Asegúrate de que:`);
    console.log(`1. La base de datos '${DB_CONFIG.database}' existe`);
    console.log(`2. El usuario '${DB_CONFIG.user}' tiene acceso a ella`);
    console.log(`3. La contraseña es correcta`);
    console.log(
      `4. El servidor PostgreSQL está en ejecución en ${DB_CONFIG.host}:${DB_CONFIG.port}`,
    );

    return false;
  }
};

// Función para realizar consultas a la base de datos
export const query = async (text: string, params: any[] = []): Promise<any> => {
  try {
    const { rows } = await pool.query(text, params);
    return rows;
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    throw error;
  }
};

export default pool;
