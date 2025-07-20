import { MAX_MESSAGE_LENGTH } from '../constants';
export * from './markdown';

export const splitMessage = (
  message: string,
  maxLength: number = MAX_MESSAGE_LENGTH,
) => {
  const parts = [];
  while (message.length > maxLength) {
    let chunk = message.slice(0, maxLength);
    const lastNewline = chunk.lastIndexOf('\n');
    if (lastNewline > -1) {
      chunk = chunk.slice(0, lastNewline + 1);
    }
    parts.push(chunk);
    message = message.slice(chunk.length);
  }
  parts.push(message);
  return parts;
};
