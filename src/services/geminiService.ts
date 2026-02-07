import { ScheduleBlock, Language } from "../types";

/**
 * Helper function to call the Gemini API via serverless function
 * This keeps the API key secure on the server-side
 */
const callGeminiAPI = async (prompt: string, config?: any): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate',
        prompt,
        config
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

export const generateTaskAdvice = async (block: ScheduleBlock, lang: Language): Promise<string> => {
  const errorMsg = lang === 'de' ? "KI-Dienst nicht verfügbar." : "AI service unavailable.";

  try {
    const prompt = `
      You are an expert Career Coach for someone looking for a job.

      The user is currently in this time block:
      Title: ${block.title}
      Description: ${block.description}
      Category: ${block.category}

      Provide a bulleted list of 3 highly specific, actionable, and productive tasks they should do right now during this hour to maximize their chances of getting hired.
      ${lang === 'de' ? 'Answer in German.' : 'Answer in English.'}
      Keep it brief, encouraging, and professional.
    `;

    const text = await callGeminiAPI(prompt);
    return text || (lang === 'de' ? "Kein Ratschlag generiert." : "No advice generated.");
  } catch (error) {
    console.error("Error generating advice:", error);
    return lang === 'de' ? "Ratschlag konnte momentan nicht generiert werden." : "Could not generate advice at this time.";
  }
};

export const analyzeJobDescription = async (description: string, lang: Language): Promise<string> => {
  try {
    const prompt = `
      Analyze the following job description.

      Job Description:
      ${(description || '').substring(0, 2000)}... (truncated)

      Output a JSON summary with:
      1. "matchScore" (0-100)
      2. "keywords" (array of strings - key skills to put in CV)
      3. "redFlags" (array of strings)
      4. "advice" (string - how to tailor the cover letter)

      ${lang === 'de' ? 'Provide the content in the JSON in German.' : 'Provide the content in the JSON in English.'}
    `;

    const text = await callGeminiAPI(prompt, { responseMimeType: 'application/json' });
    return text || "{}";
  } catch (error) {
    console.error("Error analyzing job:", error);
    return JSON.stringify({ error: lang === 'de' ? "Analyse fehlgeschlagen" : "Failed to analyze" });
  }
};
