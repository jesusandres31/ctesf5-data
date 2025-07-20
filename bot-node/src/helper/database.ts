import { query } from '../libs/psql';
import { getSchemaInfo } from '../utils/schema';
import { groq } from '../libs/groq';

/**
 * Genera una consulta SQL basada en la pregunta del usuario y el esquema de la base de datos
 * @param userQuery La pregunta del usuario
 * @param schemaText El esquema de la base de datos en formato de texto
 * @returns La consulta SQL generada
 */
/**
 * Genera una consulta SQL basada en la pregunta del usuario y el esquema de la base de datos
 * @param userQuery La pregunta del usuario
 * @param schemaText El esquema de la base de datos en formato de texto
 * @returns La consulta SQL generada o cadena vacía si no es posible
 */
async function generateSQLQuery(
  userQuery: string,
  schemaText: string,
): Promise<string> {
  try {
    console.log(
      `🔍 Generando SQL para: "${userQuery.substring(0, 50)}${
        userQuery.length > 50 ? '...' : ''
      }"`,
    );

    // Prompt específico para generar la consulta SQL
    const sqlGenerationPrompt = `
Como experto en SQL y bases de datos PostgreSQL, tu tarea es generar una consulta SQL que responda a la pregunta del usuario.
Utiliza exclusivamente las tablas y campos mencionados en el siguiente esquema de base de datos:

${schemaText}

IMPORTANTE:
- Genera SOLO la consulta SQL, sin explicaciones adicionales.
- La consulta debe ser válida para PostgreSQL.
- Incluye JOINs cuando sea necesario relacionar tablas.
- Usa comillas dobles para los nombres de tablas y columnas para evitar problemas con palabras reservadas.
- Limita los resultados a un máximo de 20 filas a menos que se pida específicamente más.
- Si la consulta requiere ordenamiento, incluye la cláusula ORDER BY apropiada.
- Prefiere JOIN LATERAL cuando necesites realizar subconsultas correlacionadas.
- Usa alias de tabla descriptivos para mejorar la legibilidad.
- Si la consulta no se puede responder con el esquema disponible, responde exactamente con: "NO_SQL_POSSIBLE".

Pregunta del usuario: "${userQuery}"
Consulta SQL:`;

    // Llamada a Groq para generar la consulta SQL
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: sqlGenerationPrompt },
        { role: 'user', content: userQuery },
      ],
      max_tokens: 800, // Aumentamos el límite para consultas más complejas
      temperature: 0.1, // Baja temperatura para respuestas más deterministas
    });

    // Extraer la consulta SQL generada
    const generatedSQL =
      chatCompletion.choices[0]?.message?.content?.trim() || '';

    // Si el modelo indica que no es posible generar una consulta SQL
    if (generatedSQL === 'NO_SQL_POSSIBLE' || !generatedSQL) {
      console.log(
        '⚠️ No fue posible generar una consulta SQL para esta pregunta',
      );
      return '';
    }

    // Limpiar la consulta en caso de que contenga comillas o bloques de código
    let cleanSQL = generatedSQL;

    // Eliminar bloques de código markdown si existen
    if (cleanSQL.startsWith('```sql') || cleanSQL.startsWith('```')) {
      cleanSQL = cleanSQL.replace(/```sql\n|```\n|```/g, '').trim();
    }

    console.log('✅ SQL generado correctamente:', cleanSQL);
    return cleanSQL;
  } catch (error: any) {
    console.error('❌ Error al generar consulta SQL:', error.message);
    console.error('Detalles del error:', error);
    return '';
  }
}

/**
 * Busca información relevante en la base de datos basada en la consulta del usuario
 * Esta función es utilizada para el RAG (Retrieval-Augmented Generation)
 * Ahora sigue un enfoque de dos pasos: generar SQL y luego ejecutarlo
 */
export const searchRelevantData = async (
  userQuery: string,
): Promise<string> => {
  try {
    console.log(`🔍 Procesando consulta: "${userQuery}"`);

    // Verificar que estamos conectados a la base de datos
    try {
      const dbCheck = await query('SELECT current_database() as db_name', []);
      const currentDb = dbCheck[0]?.db_name;
      console.log(`�️ Conectado a base de datos: ${currentDb}`);
    } catch (connError: any) {
      console.error(`❌ Error al verificar la conexión: ${connError.message}`);
      return 'No se pudo conectar a la base de datos. Por favor, inténtelo de nuevo más tarde.';
    }

    // Obtener el esquema desde el archivo
    const { schemaText, tables } = getSchemaInfo();
    if (tables.length === 0) {
      console.log('⚠️ No se pudo cargar el esquema desde el archivo');
      return 'No se pudo cargar la información del esquema de la base de datos.';
    }

    console.log(`📊 Esquema cargado: ${tables.length} tablas encontradas`);

    // PASO 1: Generar la consulta SQL basada en la pregunta del usuario
    console.log('🤖 Generando consulta SQL basada en la pregunta...');
    const sqlQuery = await generateSQLQuery(userQuery, schemaText);

    if (!sqlQuery) {
      console.log('⚠️ No se pudo generar una consulta SQL para esta pregunta');

      // Proporcionar el esquema como contexto para que el LLM pueda explicar por qué no puede responder
      return `Información sobre el esquema de la base de datos:\n\n${schemaText}\n\nNo se encontró información suficiente en la base de datos para responder a la consulta específica.`;
    }

    // PASO 2: Ejecutar la consulta SQL generada
    console.log('🔍 Ejecutando la consulta SQL generada...');
    let queryResults: any[] = [];

    try {
      queryResults = await query(sqlQuery, []);
      console.log(
        `✅ Consulta ejecutada con éxito: ${queryResults.length} resultados`,
      );
    } catch (sqlError: any) {
      console.error('❌ Error al ejecutar la consulta generada:', sqlError);

      // Proporcionar información sobre el error junto con el esquema
      return `Información sobre el esquema de la base de datos:\n\n${schemaText}\n\nSe intentó ejecutar la siguiente consulta:\n\`\`\`sql\n${sqlQuery}\n\`\`\`\n\nPero ocurrió un error: ${sqlError.message}`;
    }

    // Si no hay resultados, informar que no se encontraron datos
    if (queryResults.length === 0) {
      console.log('⚠️ La consulta no devolvió resultados');
      return `Información sobre el esquema de la base de datos:\n\n${schemaText}\n\nSe ejecutó la siguiente consulta:\n\`\`\`sql\n${sqlQuery}\n\`\`\`\n\nLa consulta se ejecutó correctamente, pero no se encontraron datos que respondan a tu pregunta.`;
    }

    // PASO 3: Formatear los resultados para enviarlos al LLM
    console.log('📋 Formateando los resultados para respuesta...');

    // Convertir los resultados a formato tabular para mejor visualización
    let formattedResults = '';

    // Extraer los nombres de las columnas
    const columnNames = Object.keys(queryResults[0]);
    formattedResults += `Columnas: ${columnNames.join(', ')}\n\n`;

    // Añadir los datos fila por fila
    formattedResults += queryResults
      .map((row, index) => {
        let rowStr = `Fila ${index + 1}:\n`;
        Object.entries(row).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            // Limitar el tamaño de los valores muy grandes
            const strValue = String(value);
            const displayValue =
              strValue.length > 200
                ? `${strValue.substring(0, 200)}... (truncado)`
                : strValue;
            rowStr += `  ${key}: ${displayValue}\n`;
          }
        });
        return rowStr;
      })
      .join('\n');

    // Preparar el contexto para el LLM
    const context = `
PREGUNTA DEL USUARIO: ${userQuery}

ESQUEMA DE BASE DE DATOS RELEVANTE:
${schemaText}

CONSULTA SQL EJECUTADA:
\`\`\`sql
${sqlQuery}
\`\`\`

RESULTADOS DE LA CONSULTA (${queryResults.length} filas):
${formattedResults}

Por favor, responde a la pregunta del usuario de forma concisa y directa basándote en los resultados mostrados arriba.
No menciones la consulta SQL utilizada ni el proceso técnico, simplemente proporciona una respuesta informativa.
Utiliza los datos obtenidos para responder específicamente lo que se preguntó.
`;

    return context;
  } catch (error: any) {
    console.error(`❌ Error al buscar datos relevantes: ${error.message}`);
    return 'Lo siento, hubo un error al buscar información en la base de datos.';
  }
};
