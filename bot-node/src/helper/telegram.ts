import bot from '../libs/telegram';
import {
  splitMessage,
  sanitizeMarkdown,
  isMarkdownSafe,
} from '../utils/telegram';
import { askGroqLLM } from './groq';

// Prompt del sistema mejorado para RAG con enfoque de dos pasos
const systemPrompt = `Eres un asistente de IA útil que responde a preguntas utilizando información de la base de datos proporcionada.

INSTRUCCIONES IMPORTANTES:
- Responde de manera directa y concisa a las preguntas del usuario.
- Utiliza la información de la base de datos que se te proporciona para tus respuestas.
- Presenta datos numéricos de forma clara y fácil de entender.
- Si no dispones de información suficiente, responde honestamente diciendo que no tienes esa información.
- NO menciones que estás usando una base de datos, consultas SQL o procesos técnicos en tu respuesta.
- NO expliques cómo se obtuvo la información, simplemente proporciona la respuesta.

FORMATO DE RESPUESTA:
- Formatea tu respuesta utilizando Markdown simple para mejorar la legibilidad.
- Evita usar Markdown anidado o formatos complejos que puedan causar problemas.
- Usa negrita (*texto*) para destacar información importante.
- Usa listas con guiones para enumerar elementos cuando sea apropiado.
- Usa tablas simples solo cuando sea esencial para presentar datos comparativos.
- Evita usar demasiados caracteres especiales de Markdown.`;

export const setupBot = () => {
  // Comando /start
  bot.start(async ctx => {
    const name = ctx.from?.first_name || 'usuario';
    await ctx.reply(
      `¡Hola, ${name}! 👋\n\nSoy un asistente de IA que puede responder a tus preguntas utilizando información de nuestra base de datos.\n\nSimplemente escribe tu pregunta y te responderé lo mejor posible basándome en los datos disponibles.`,
    );
  });

  // Comando /help
  bot.help(async ctx => {
    await ctx.reply(
      `*Comandos disponibles:*\n\n` +
        `/start - Inicia el bot\n` +
        `/help - Muestra esta ayuda\n\n` +
        `Para hacer una consulta, simplemente escribe tu pregunta y te responderé utilizando la información disponible en nuestra base de datos.`,
      { parse_mode: 'Markdown' },
    );
  });

  // Manejar mensajes de texto
  bot.on('text', async ctx => {
    // Ignorar comandos
    if (ctx.message.text.startsWith('/')) return;

    // Mostrar indicador de "escribiendo..."
    await ctx.replyWithChatAction('typing');

    // Mensaje para indicar que está procesando
    const statusMessage = await ctx.reply(
      '🔍 Buscando información relevante...',
    );

    try {
      // Obtener respuesta del modelo con RAG
      const answer = await askGroqLLM(ctx.message.text, systemPrompt);

      // Eliminar el mensaje de estado
      await ctx.telegram
        .deleteMessage(ctx.chat.id, statusMessage.message_id)
        .catch(() => {});

      // Verificar y sanitizar el formato Markdown
      let processedAnswer = answer;

      // Verificar si el Markdown está bien formado
      if (!isMarkdownSafe(answer)) {
        console.log('⚠️ Formato Markdown incorrecto, aplicando sanitización');
        processedAnswer = sanitizeMarkdown(answer);
      }

      // Dividir la respuesta si es necesario
      const messageParts = splitMessage(processedAnswer);

      // Enviar cada parte de la respuesta
      for (const part of messageParts) {
        try {
          await ctx.reply(part, { parse_mode: 'Markdown' });
        } catch (markdownError) {
          console.error(
            'Error al enviar mensaje con formato Markdown:',
            markdownError,
          );
          // Si hay error con el Markdown, enviar sin formato
          await ctx.reply(`${part}`, { parse_mode: undefined });
        }
      }
    } catch (error: any) {
      console.error('Error al procesar la consulta:', error);

      // Eliminar el mensaje de estado
      await ctx.telegram
        .deleteMessage(ctx.chat.id, statusMessage.message_id)
        .catch(() => {});

      // Intentar enviar un mensaje detallado si el error es de formato Markdown
      if (
        error.description &&
        error.description.includes("can't parse entities")
      ) {
        console.log('Error de formato Markdown, intentando enviar sin formato');
        try {
          // Obtener la respuesta nuevamente
          const answer = await askGroqLLM(ctx.message.text, systemPrompt);
          const messageParts = splitMessage(answer);

          // Enviar sin formato Markdown
          for (const part of messageParts) {
            await ctx.reply(part);
          }
          return;
        } catch (secondError) {
          console.error('Error al reintentar sin formato:', secondError);
        }
      }

      // Enviar mensaje de error
      await ctx.reply(
        `❌ Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta de nuevo más tarde.`,
      );
    }
  });
};
