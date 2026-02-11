export const validateGeminiConfig = (cfg: any) => {
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    return undefined;
  }

  const allowedParams: Record<string, (val: any) => boolean> = {
    temperature: (v) => typeof v === 'number',
    topP: (v) => typeof v === 'number',
    topK: (v) => typeof v === 'number',
    candidateCount: (v) => typeof v === 'number',
    maxOutputTokens: (v) => typeof v === 'number',
    stopSequences: (v) => Array.isArray(v) && v.every(s => typeof s === 'string'),
    responseMimeType: (v) => typeof v === 'string',
    responseSchema: (v) => typeof v === 'object' && v !== null,
    presencePenalty: (v) => typeof v === 'number',
    frequencyPenalty: (v) => typeof v === 'number',
    seed: (v) => typeof v === 'number'
  };

  const validated: any = {};
  for (const key in allowedParams) {
    if (key in cfg) {
      const value = cfg[key];
      if (allowedParams[key](value)) {
        validated[key] = value;
      }
    }
  }

  return Object.keys(validated).length > 0 ? validated : undefined;
};
