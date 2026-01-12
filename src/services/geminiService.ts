import { GoogleGenAI } from "@google/genai";
import { ScheduleBlock, RoleFocus, Language } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTaskAdvice = async (block: ScheduleBlock, roleFocus: RoleFocus, lang: Language): Promise<string> => {
  const ai = getAIClient();
  const errorMsg = lang === 'de' ? "KI-Dienst nicht verfügbar." : "AI service unavailable.";
  if (!ai) return errorMsg;

  try {
    const prompt = `
      You are an expert Career Coach for someone looking for a job in ${roleFocus} (Project Management or QA).
      
      The user is currently in this time block:
      Title: ${block.title}
      Description: ${block.description}
      Category: ${block.category}
      
      Provide a bulleted list of 3 highly specific, actionable, and productive tasks they should do right now during this hour to maximize their chances of getting hired.
      ${lang === 'de' ? 'Answer in German.' : 'Answer in English.'} 
      Keep it brief, encouraging, and professional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || (lang === 'de' ? "Kein Ratschlag generiert." : "No advice generated.");
  } catch (error) {
    console.error("Error generating advice:", error);
    return lang === 'de' ? "Ratschlag konnte momentan nicht generiert werden." : "Could not generate advice at this time.";
  }
};

export const analyzeJobDescription = async (description: string, myRole: RoleFocus, lang: Language): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return lang === 'de' ? "KI-Dienst nicht verfügbar." : "AI service unavailable.";

  try {
    const prompt = `
      Analyze the following job description for a ${myRole} role.
      
      Job Description:
      ${description.substring(0, 2000)}... (truncated)

      Output a JSON summary with:
      1. "matchScore" (0-100)
      2. "keywords" (array of strings - key skills to put in CV)
      3. "redFlags" (array of strings)
      4. "advice" (string - how to tailor the cover letter)
      
      ${lang === 'de' ? 'Provide the content in the JSON in German.' : 'Provide the content in the JSON in English.'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Error analyzing job:", error);
    return JSON.stringify({ error: lang === 'de' ? "Analyse fehlgeschlagen" : "Failed to analyze" });
  }
};
