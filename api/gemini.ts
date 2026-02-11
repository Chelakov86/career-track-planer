import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { validateGeminiConfig } from './utils/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment (server-side, not exposed to client)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment variables');
    return res.status(500).json({ error: 'API configuration error' });
  }

  try {
    const { action, prompt, config } = req.body;

    // Validate config to prevent passing unallowed parameters
    const validatedConfig = validateGeminiConfig(config);

    if (!action || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: action, prompt' });
    }

    // Initialize Gemini client
    const genAI = new GoogleGenAI({ apiKey });

    // Generate content based on the request
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      ...(validatedConfig && { config: validatedConfig })
    });

    const text = response.text || '';

    return res.status(200).json({
      success: true,
      text
    });

  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({
      error: 'Failed to generate content',
      message: error.message
    });
  }
}
