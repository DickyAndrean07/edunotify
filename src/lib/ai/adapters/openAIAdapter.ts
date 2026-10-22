import { AICompletionProvider, AIOptions, AIProviderType } from '../types';
import { safeLogError } from '../sanitizer';

export interface OpenAIAdapterConfig {
  baseUrl?: string;
  apiKey?: string;
  modelName?: string;
  defaultTimeoutMs?: number;
}

export class OpenAIAdapter implements AICompletionProvider {
  public readonly name = 'OpenAI Cloud Adapter';
  public readonly providerType: AIProviderType = 'openai';

  private baseUrl: string;
  private apiKey: string;
  private modelName: string;
  private defaultTimeoutMs: number;

  constructor(config?: OpenAIAdapterConfig) {
    this.baseUrl = (config?.baseUrl || process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.apiKey = config?.apiKey || process.env.AI_API_KEY || '';
    this.modelName = config?.modelName || process.env.AI_MODEL_NAME || 'gpt-4o-mini';
    this.defaultTimeoutMs = config?.defaultTimeoutMs || 15000;
  }

  public async generateText(prompt: string, options?: AIOptions): Promise<string> {
    const timeout = options?.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    try {
      const url = `${this.baseUrl}/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 1500,
        }),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `OpenAI request failed with status ${response.status}: ${errorText.substring(0, 100)}`
        );
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('OpenAI returned empty or invalid response content');
      }

      return content;
    } catch (err: any) {
      safeLogError('OpenAIAdapter.generateText error', err);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const url = `${this.baseUrl}/models`;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
      };

      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }
}
