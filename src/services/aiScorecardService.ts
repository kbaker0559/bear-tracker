import type {
  AIConnectionStatus,
  ScorecardRecognitionResult,
  ScorecardIdentityRecognitionResult
} from '../types/aiScorecard';

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as { error?: string } | T | null;
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body && body.error
      ? body.error
      : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}

export async function getAIConnectionStatus(): Promise<AIConnectionStatus> {
  const response = await fetch('/api/ai/status');
  return readJson<AIConnectionStatus>(response);
}

export async function testAIConnection(): Promise<AIConnectionStatus> {
  const response = await fetch('/api/ai/test', { method: 'POST' });
  return readJson<AIConnectionStatus>(response);
}

export async function recognizeScorecard(
  imageUrl: string,
  expectedPlayerNames: string[]
): Promise<ScorecardRecognitionResult> {
  const response = await fetch('/api/ai/read-scorecard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, expectedPlayerNames })
  });
  return readJson<ScorecardRecognitionResult>(response);
}

export async function recognizeScorecardIdentity(
  imageUrl: string,
  expectedPlayerNames: string[],
  expectedCardNumber: number,
  expectedTeeTime: string
): Promise<ScorecardIdentityRecognitionResult> {
  const response = await fetch('/api/ai/read-scorecard-identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, expectedPlayerNames, expectedCardNumber, expectedTeeTime })
  });
  return readJson<ScorecardIdentityRecognitionResult>(response);
}
