import { test, expect } from '@playwright/test';

/**
 * Direct HTTP contract tests for the Vercel Gemini endpoint.
 *
 * These tests were created with AI-assisted coding (ChatGPT/Codex-style workflow)
 * and are intentionally kept small and explicit so each assertion can be reviewed
 * and understood independently.
 *
 * Vite does not serve /api/gemini locally, so the suite targets API_BASE_URL when
 * provided and otherwise the deployed CareerTrack application.
 */
const apiBaseUrl = process.env.API_BASE_URL ?? 'https://career-track-planer.vercel.app';
const endpoint = `${apiBaseUrl}/api/gemini`;

test.describe('Gemini API contract', () => {
  test('rejects unsupported HTTP methods with 405 and an error JSON body', async ({ request }) => {
    const response = await request.get(endpoint);

    expect(response.status()).toBe(405);
    expect(response.headers()['content-type']).toContain('application/json');
    await expect(response.json()).resolves.toEqual({ error: 'Method not allowed' });
  });

  test('rejects a request without action with 400', async ({ request }) => {
    const response = await request.post(endpoint, {
      data: { prompt: 'Return exactly OK.' },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');
    await expect(response.json()).resolves.toEqual({
      error: 'Missing required fields: action, prompt',
    });
  });

  test('rejects a request without prompt with 400', async ({ request }) => {
    const response = await request.post(endpoint, {
      data: { action: 'test' },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');
    await expect(response.json()).resolves.toEqual({
      error: 'Missing required fields: action, prompt',
    });
  });

  test('returns the documented success contract for a valid request', async ({ request }) => {
    const response = await request.post(endpoint, {
      data: {
        action: 'test',
        prompt: 'Return exactly the word OK and nothing else.',
        config: {
          temperature: 0,
          maxOutputTokens: 10,
        },
      },
      timeout: 30_000,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toMatchObject({ success: true });
    expect(typeof body.text).toBe('string');
    expect(body.text.length).toBeGreaterThan(0);
  });
});
