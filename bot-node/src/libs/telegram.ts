import { Telegraf } from 'telegraf';
import { TELEGRAM_TOKEN } from '../config';

if (!TELEGRAM_TOKEN) {
  throw new Error('TELEGRAM_TOKEN is not set in environment variables.');
}

const bot = new Telegraf(TELEGRAM_TOKEN);

export default bot;

export const startTelegramBot = () => {
  bot.launch();
  console.log('🤖 Bot de Telegram iniciado.');
};
