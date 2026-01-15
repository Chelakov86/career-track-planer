# API - Serverless Functions

This directory contains Vercel serverless functions for the CareerTrack Planer application.

## `/api/gemini.ts`

Serverless function that securely handles Gemini AI API calls.

### Why Serverless?

Instead of exposing the Gemini API key in client-side code, this function:
- Keeps the API key secure on the server-side
- Prevents unauthorized API usage
- Protects against unexpected costs from API key exposure

### Endpoint

**POST** `/api/gemini`

### Request Body

```json
{
  "action": "generate",
  "prompt": "Your prompt text here",
  "config": {
    "responseMimeType": "application/json"  // Optional
  }
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "text": "Generated response from Gemini"
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Error message"
}
```

### Environment Variables

The function requires the following server-side environment variable:

- `GEMINI_API_KEY` - Your Google Gemini API key (no `VITE_` prefix)

**Important:** This variable should be set in:
- Vercel Dashboard → Settings → Environment Variables (for production)
- `.env.local` file (for local development)

### Local Development

When running `npm run dev`, Vite will automatically load environment variables from `.env.local`.

The serverless function will be available at `http://localhost:3000/api/gemini`.

### Security

- API key is never exposed to the client
- Only POST requests are allowed
- Input validation on request body
- Error messages don't expose sensitive information

### Usage Example

From client-side code:

```typescript
const response = await fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generate',
    prompt: 'Your prompt here'
  })
});

const data = await response.json();
console.log(data.text);
```
