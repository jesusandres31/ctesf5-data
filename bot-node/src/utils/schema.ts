import fs from 'fs';
import path from 'path';

export interface TableInfo {
  name: string;
  description: string;
  columns: string[];
}

export function getSchemaInfo(): { tables: TableInfo[]; schemaText: string } {
  try {
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.txt');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Extraer información sobre las tablas
    const tables: TableInfo[] = [];

    // Expresión regular para encontrar definiciones de tablas
    const tableRegex = /- ([a-zA-Z0-9_]+):\s*([^-]*)/g;
    let match;

    while ((match = tableRegex.exec(schemaContent)) !== null) {
      const tableName = match[1].trim();
      const description = match[2].trim();

      // Extraer columnas de la descripción
      const columns: string[] = [];
      const descriptionLines = description.split('\n');

      for (const line of descriptionLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('-')) {
          // Capturar columnas
          const columnsLine = trimmedLine.substring(1).trim();

          // Dividir múltiples columnas si están en la misma línea
          const columnParts = columnsLine.split(',');
          for (const part of columnParts) {
            if (part.trim()) {
              columns.push(part.trim());
            }
          }
        }
      }

      tables.push({
        name: tableName,
        description,
        columns,
      });
    }

    console.log(
      `📋 Esquema cargado desde archivo: ${tables.length} tablas encontradas`,
    );
    return {
      tables,
      schemaText: schemaContent,
    };
  } catch (error) {
    console.error('❌ Error al leer el esquema desde archivo:', error);
    return {
      tables: [],
      schemaText: 'No se pudo cargar el esquema',
    };
  }
}
