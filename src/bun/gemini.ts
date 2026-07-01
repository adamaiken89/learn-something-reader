import { logger } from './logger';
import * as storageModule from './storage';

const BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getAPIKey(): string | null {
  return storageModule.getGeminiKey();
}

function saveAPIKey(key: string): void {
  storageModule.setGeminiKey(key);
}

export function hasAPIKey(): boolean {
  return getAPIKey() !== null;
}

export function setAPIKey(key: string): void {
  saveAPIKey(key);
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
}

interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

export async function askGemini(question: string, context: string): Promise<string> {
  const apiKey = getAPIKey();
  if (!apiKey) {
    logger.warn('Gemini API key not set');
    throw new Error('No API key set. Set your Gemini API key in Settings.');
  }

  const prompt = [
    'You are a tutor helping understand course material.',
    '',
    'Context from the course:',
    context,
    '',
    'Question from the student:',
    question,
    '',
    'Provide a clear, concise explanation. Use examples where helpful.',
  ].join('\n');

  const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    } as GeminiRequest),
  });

  if (!response.ok) {
    const errText = await response.text();
    logger.error({ status: response.status, errText }, 'Gemini API request failed');
    throw new Error(`API error (${response.status}): ${errText}`);
  }

  const result = (await response.json()) as GeminiResponse;
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    logger.error('Gemini returned empty response');
    throw new Error('Invalid response from API.');
  }

  return text;
}
