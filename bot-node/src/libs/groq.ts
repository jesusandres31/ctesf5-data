import { GROQ_API_KEY } from '../config';
import Groq from 'groq-sdk';

if (!GROQ_API_KEY)
  throw new Error('GROQ_API_KEY is not set in environment variables.');

export const groq = new Groq({ apiKey: GROQ_API_KEY });
