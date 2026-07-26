import { useEffect, useState } from 'react';
import type { AIConnectionStatus } from '../types/aiScorecard';
import {
  getAIConnectionStatus,
  testAIConnection
} from '../services/aiScorecardService';

export default function AIRecognitionSettings() {
  const [status, setStatus] = useState<AIConnectionStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getAIConnectionStatus()
      .then(setStatus)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'AI status could not be loaded.'));
  }, []);

  async function handleTest() {
    setBusy(true);
    setError('');
    try {
      setStatus(await testAIConnection());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connection test failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card ai-recognition-settings">
      <h3>AI Scorecard Recognition</h3>
      <p>
        Scorecard photos are sent through Bear Tracker's server endpoint. The OpenAI API key stays on the server and is never stored in the browser or committed to GitHub.
      </p>
      <div className="score-grid">
        <div className="score-row"><strong>Provider</strong><span>OpenAI</span></div>
        <div className="score-row"><strong>Model</strong><span>{status?.model ?? 'Checking…'}</span></div>
        <div className="score-row">
          <strong>Status</strong>
          <span>{status ? (status.configured ? 'Configured' : 'Not configured') : 'Checking…'}</span>
        </div>
      </div>
      {status && <div className="status-box">{status.message}</div>}
      {error && <div className="status-box">{error}</div>}
      <button type="button" disabled={busy || !status?.configured} onClick={() => void handleTest()}>
        {busy ? 'Testing Connection…' : 'Test Connection'}
      </button>
      {!status?.configured && (
        <small>
          Add OPENAI_API_KEY to the project's .env.local file, then restart Bear Tracker. Do not use a VITE_ prefix.
        </small>
      )}
    </section>
  );
}
