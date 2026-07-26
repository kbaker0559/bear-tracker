# AI Scorecard Recognition Setup

## Development setup

1. Create a file named `.env.local` in the Bear Tracker project root.
2. Add:

   OPENAI_API_KEY=your_real_key_here
   OPENAI_SCORECARD_MODEL=gpt-4.1-mini

3. Restart Bear Tracker with `npm.cmd run dev`.
4. Open Administration and use **Test Connection**.
5. Attach a paper scorecard photo and choose **Read Scorecard with AI**.

The API key is read only by the Vite development server. It is not exposed through a `VITE_` variable, stored in browser local storage, or intended for Git.

## Production note

The included `/api/ai/*` endpoints run through the Vite development server. Before publishing AI recognition to a static host such as GitHub Pages, move the same endpoint logic to a serverless function or other protected backend. A static site cannot safely hold an OpenAI API key.
