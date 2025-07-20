import { groq } from '../libs/groq';
import { searchRelevantData } from './database';

export async function askGroqLLM(
  message: string,
  systemPrompt: string,
): Promise<string> {
  try {
    console.log('🤖 Procesando pregunta con Groq...');

    // Buscar información relevante en la base de datos (ahora incluye la generación de SQL)
    console.log('🔍 Buscando información relevante en la base de datos...');
    const relevantData = await searchRelevantData(message);

    // Construir el prompt con el contexto recuperado (RAG)
    let enhancedPrompt = systemPrompt;
    if (relevantData) {
      console.log(
        '✅ Información relevante encontrada, generando respuesta...',
      );
      enhancedPrompt += `\n\nA continuación te proporciono información relevante para responder a la consulta del usuario:\n${relevantData}\n\nPor favor, utiliza esta información para dar una respuesta precisa y concisa. No menciones que estás usando una base de datos o consultas SQL, simplemente proporciona una respuesta directa a la pregunta.`;
    } else {
      console.log(
        '⚠️ No se encontró información relevante en la base de datos',
      );
    }

    // Ajustamos la temperatura para respuestas más consistentes cuando tenemos datos de la DB
    const temperature = relevantData ? 0.3 : 0.7;

    // Llamada al modelo con el prompt mejorado
    console.log('🤖 Generando respuesta final...');
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: enhancedPrompt,
        },
        { role: 'user', content: message },
      ],
      temperature: temperature,
      max_tokens: 1000,
    });

    console.log('✅ Respuesta generada correctamente');
    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('❌ Error en askGroqLLM:', error);
    throw error;
  }
}
