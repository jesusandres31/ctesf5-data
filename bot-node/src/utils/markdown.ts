/**
 * Utilidades para manejar el formato Markdown en mensajes de Telegram
 */

// Caracteres que deben escaparse en Markdown
const SPECIAL_CHARACTERS = [
  '_',
  '*',
  '[',
  ']',
  '(',
  ')',
  '~',
  '`',
  '>',
  '#',
  '+',
  '-',
  '=',
  '|',
  '{',
  '}',
  '.',
  '!',
];

/**
 * Sanitiza el texto que contiene Markdown para evitar errores de parseo
 * Preserva el formato Markdown intencional (como negritas, cursivas, etc.)
 * pero escapa caracteres que podrían causar problemas
 */
export function sanitizeMarkdown(text: string): string {
  if (!text) return '';

  try {
    // Reemplazo seguro para ciertas estructuras comunes de Markdown
    // Preservamos los formatos básicos
    const preservedFormats = [
      { pattern: /(\*\*|__)(.*?)\1/g, replacement: '$1$2$1' }, // Negrita: **texto** o __texto__
      { pattern: /(\*|_)(.*?)\1/g, replacement: '$1$2$1' }, // Cursiva: *texto* o _texto_
      { pattern: /`([^`]+)`/g, replacement: '`$1`' }, // Código inline: `código`
      { pattern: /```([\s\S]*?)```/g, replacement: '```$1```' }, // Bloques de código: ```código```
      { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '[$1]($2)' }, // Enlaces: [texto](url)
    ];

    // Primero guardamos los formatos que queremos preservar
    let processedText = text;
    const preservedParts: string[] = [];

    preservedFormats.forEach((format, index) => {
      processedText = processedText.replace(format.pattern, match => {
        preservedParts.push(match);
        return `{{PRESERVED_${index}_${preservedParts.length - 1}}}`;
      });
    });

    // Ahora escapamos todo lo demás
    SPECIAL_CHARACTERS.forEach(char => {
      const regex = new RegExp('\\' + char, 'g');
      processedText = processedText.replace(regex, '\\' + char);
    });

    // Restauramos los formatos preservados
    preservedFormats.forEach((_, formatIndex) => {
      for (let i = 0; i < preservedParts.length; i++) {
        const placeholder = `{{PRESERVED_${formatIndex}_${i}}}`;
        if (processedText.includes(placeholder)) {
          processedText = processedText.replace(placeholder, preservedParts[i]);
        }
      }
    });

    return processedText;
  } catch (error) {
    // Si hay algún error, simplemente elimina todo el formato Markdown
    console.error('Error al sanitizar Markdown, eliminando formato:', error);
    return text.replace(/[_*[\]()~`>#+=|{}\.!]/g, '\\$&');
  }
}

/**
 * Verifica si un texto contiene Markdown mal formado
 * Devuelve true si el texto es seguro
 */
export function isMarkdownSafe(text: string): boolean {
  try {
    // Comprobación simple de balance de caracteres especiales
    const pairs = [
      ['*', '*'],
      ['_', '_'],
      ['`', '`'],
      ['[', ']'],
      ['(', ')'],
      ['{', '}'],
      ['```', '```'],
    ];

    for (const [open, close] of pairs) {
      const openCount = (text.match(new RegExp('\\' + open, 'g')) || []).length;
      const closeCount = (text.match(new RegExp('\\' + close, 'g')) || [])
        .length;

      if (openCount !== closeCount) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}
