import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

const DEFAULT_MODEL = 'gpt-4.1-mini';
const MAX_REQUEST_BYTES = 16 * 1024 * 1024;

type JsonRecord = Record<string, unknown>;

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<JsonRecord> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_REQUEST_BYTES) throw new Error('The scorecard photo is too large to process.');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as JsonRecord;
}

function responseText(payload: JsonRecord): string {
  if (typeof payload.output_text === 'string') return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = Array.isArray((item as JsonRecord).content) ? (item as JsonRecord).content as unknown[] : [];
    for (const part of content) {
      if (part && typeof part === 'object' && typeof (part as JsonRecord).text === 'string') {
        return (part as JsonRecord).text as string;
      }
    }
  }
  throw new Error('OpenAI returned no structured scorecard result.');
}

function aiApiPlugin(apiKey: string, model: string): Plugin {
  const configured = Boolean(apiKey);
  const statusBody = {
    configured,
    provider: 'openai',
    model,
    message: configured
      ? 'The server has an OpenAI API key available.'
      : 'OPENAI_API_KEY is not configured on the Bear Tracker server.'
  };

  return {
    name: 'bear-tracker-ai-api',
    configureServer(server) {
      server.middlewares.use('/api/ai/status', (_request, response) => {
        sendJson(response, 200, statusBody);
      });

      server.middlewares.use('/api/ai/test', async (request, response) => {
        if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });
        if (!configured) return sendJson(response, 503, { error: statusBody.message });
        try {
          const openAIResponse = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
            headers: { Authorization: `Bearer ${apiKey}` }
          });
          if (!openAIResponse.ok) {
            const detail = await openAIResponse.text();
            throw new Error(`OpenAI rejected the connection (${openAIResponse.status}). ${detail.slice(0, 300)}`);
          }
          sendJson(response, 200, { ...statusBody, message: `Connected successfully. Model ${model} is available.` });
        } catch (error) {
          sendJson(response, 502, { error: error instanceof Error ? error.message : 'OpenAI connection failed.' });
        }
      });

      server.middlewares.use('/api/ai/read-scorecard', async (request, response) => {
        if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });
        if (!configured) return sendJson(response, 503, { error: statusBody.message });
        try {
          const body = await readJsonBody(request);
          const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : '';
          const expectedPlayerNames = Array.isArray(body.expectedPlayerNames)
            ? body.expectedPlayerNames.filter((name): name is string => typeof name === 'string')
            : [];
          if (!imageUrl.startsWith('data:image/')) throw new Error('A valid attached scorecard image is required.');

          const prompt = [
            'Read this Black Bear golf scorecard.',
            `The assigned players, in scorecard order, are: ${expectedPlayerNames.join(', ')}.`,
            'Return one player object for each assigned player and exactly 18 gross hole scores per player.',
            'Use null when a score cannot be read. Confidence is from 0 to 1.',
            'Do not use handwritten totals as hole scores. Do not calculate Stableford points.'
          ].join('\n');

          const schema = {
            type: 'object',
            additionalProperties: false,
            required: ['players', 'warnings'],
            properties: {
              players: {
                type: 'array',
                items: {
                  type: 'object', additionalProperties: false,
                  required: ['name', 'confidence', 'scores'],
                  properties: {
                    name: { type: 'string' },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    scores: {
                      type: 'array', minItems: 18, maxItems: 18,
                      items: {
                        type: 'object', additionalProperties: false,
                        required: ['holeNumber', 'score', 'confidence', 'reviewReason'],
                        properties: {
                          holeNumber: { type: 'integer', minimum: 1, maximum: 18 },
                          score: { type: ['integer', 'null'], minimum: 1, maximum: 15 },
                          confidence: { type: 'number', minimum: 0, maximum: 1 },
                          reviewReason: { type: ['string', 'null'] }
                        }
                      }
                    }
                  }
                }
              },
              warnings: { type: 'array', items: { type: 'string' } }
            }
          };

          const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              input: [{
                role: 'user',
                content: [
                  { type: 'input_text', text: prompt },
                  { type: 'input_image', image_url: imageUrl, detail: 'high' }
                ]
              }],
              text: {
                format: {
                  type: 'json_schema',
                  name: 'black_bear_scorecard',
                  strict: true,
                  schema
                }
              }
            })
          });

          const payload = await openAIResponse.json() as JsonRecord;
          if (!openAIResponse.ok) {
            const errorObject = payload.error as JsonRecord | undefined;
            throw new Error(typeof errorObject?.message === 'string' ? errorObject.message : `OpenAI request failed (${openAIResponse.status}).`);
          }
          const result = JSON.parse(responseText(payload)) as JsonRecord;
          sendJson(response, 200, { provider: 'openai', model, ...result });
        } catch (error) {
          sendJson(response, 502, { error: error instanceof Error ? error.message : 'The scorecard could not be read.' });
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.OPENAI_API_KEY ?? '';
  const model = env.OPENAI_SCORECARD_MODEL || DEFAULT_MODEL;
  return {
    plugins: [react(), aiApiPlugin(apiKey, model)],
    base: '/bear-tracker/'
  };
});
