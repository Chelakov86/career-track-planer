import { test, expect } from '@playwright/test';
import { validateGeminiConfig } from '../api/utils/validation';

test.describe('validateGeminiConfig Unit Tests', () => {
  test('should return undefined for non-object inputs', () => {
    expect(validateGeminiConfig(null)).toBeUndefined();
    expect(validateGeminiConfig(undefined)).toBeUndefined();
    expect(validateGeminiConfig([])).toBeUndefined();
    expect(validateGeminiConfig('string')).toBeUndefined();
    expect(validateGeminiConfig(123)).toBeUndefined();
  });

  test('should return undefined for empty objects', () => {
    expect(validateGeminiConfig({})).toBeUndefined();
  });

  test('should validate a full valid configuration', () => {
    const validConfig = {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      candidateCount: 1,
      maxOutputTokens: 1024,
      stopSequences: ['STOP'],
      responseMimeType: 'application/json',
      responseSchema: { type: 'object' },
      presencePenalty: 0.1,
      frequencyPenalty: 0.2,
      seed: 42
    };
    const result = validateGeminiConfig(validConfig);
    expect(result).toEqual(validConfig);
  });

  test('should filter out unknown parameters', () => {
    const configWithExtras = {
      temperature: 0.7,
      unknownParam: 'value'
    };
    const result = validateGeminiConfig(configWithExtras);
    expect(result).toEqual({ temperature: 0.7 });
    expect(result).not.toHaveProperty('unknownParam');
  });

  test('should validate individual numeric parameters', () => {
    const numericParams = [
      'temperature', 'topP', 'topK', 'candidateCount',
      'maxOutputTokens', 'presencePenalty', 'frequencyPenalty', 'seed'
    ];

    numericParams.forEach(param => {
      // Valid
      expect(validateGeminiConfig({ [param]: 0.5 })).toEqual({ [param]: 0.5 });
      // Invalid type
      expect(validateGeminiConfig({ [param]: '0.5' })).toBeUndefined();
    });
  });

  test('should validate stopSequences as string array', () => {
    // Valid
    expect(validateGeminiConfig({ stopSequences: ['a', 'b'] })).toEqual({ stopSequences: ['a', 'b'] });
    // Empty array (valid based on code)
    expect(validateGeminiConfig({ stopSequences: [] })).toEqual({ stopSequences: [] });
    // Invalid: not an array
    expect(validateGeminiConfig({ stopSequences: 'a' })).toBeUndefined();
    // Invalid: contains non-string
    expect(validateGeminiConfig({ stopSequences: ['a', 1] })).toBeUndefined();
  });

  test('should validate responseMimeType as string', () => {
    // Valid
    expect(validateGeminiConfig({ responseMimeType: 'text/plain' })).toEqual({ responseMimeType: 'text/plain' });
    // Invalid
    expect(validateGeminiConfig({ responseMimeType: 123 })).toBeUndefined();
  });

  test('should validate responseSchema as non-null object', () => {
    // Valid
    const schema = { type: 'string' };
    expect(validateGeminiConfig({ responseSchema: schema })).toEqual({ responseSchema: schema });
    // Invalid: null
    expect(validateGeminiConfig({ responseSchema: null })).toBeUndefined();
    // Invalid: string
    expect(validateGeminiConfig({ responseSchema: 'schema' })).toBeUndefined();
  });

  test('should return undefined if only invalid parameters are provided', () => {
    expect(validateGeminiConfig({ temperature: 'high', unknown: 123 })).toBeUndefined();
  });
});
