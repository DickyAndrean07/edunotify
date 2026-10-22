import { AICompletionProvider, AIOptions, AIProviderType } from '../types';
import { safeLogError } from '../sanitizer';

export interface AnthropicAdapterConfig {
  baseUrl?: string;
  apiKey?: string;
  modelName?: string;
  defaultTimeoutMs?: number;
}

export class AnthropicAdapter implements AICompletionProvider {
  public readonly name = 'Anthropic Cloud Adapter';
  public readonly providerType: AIProviderType = 'anthropic';

  private baseUrl: string;
  private apiKey: string;
  private modelName: string;
  private defaultTimeoutMs: number;

  constructor(config?: AnthropicAdapterConfig) {
    this.baseUrl = (config?.baseUrl || process.env.AI_BASE_URL || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
    this.apiKey = config?.apiKey || process.env.AI_API_KEY || '';
    this.modelName = config?.modelName || process.env.AI_MODEL_NAME || 'claude-3-haiku-20240307';
    this.defaultTimeoutMs = config?.defaultTimeoutMs || 15000;
  }

  public async generateText(prompt: string, options?: AIOptions): Promise<string> {
    const timeout = options?.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };

    try {
      const url = `${this.baseUrl}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.modelName,
          max_tokens: options?.maxTokens ?? 1500,
          temperature: options?.temperature ?? 0.2,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Anthropic request failed with status ${response.status}: ${errorText.substring(0, 100)}`
        );
      }

      const data = await response.json();
      const content = data?.content?.[0]?.text;
      if (!content || typeof content !== 'string') {
        throw new Error('Anthropic returned empty or invalid response content');
      }

      return content;
    } catch (err: any) {
      safeLogError('AnthropicAdapter.generateText error', err);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async healthCheck(): Promise<boolean> {
    // Anthropic doesn't have a simple free ping endpoint, verify apiKey presence
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }
}
