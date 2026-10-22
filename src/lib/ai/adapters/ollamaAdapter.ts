import { AICompletionProvider, AIOptions, AIProviderType } from '../types';
import { safeLogError } from '../sanitizer';

export interface OllamaAdapterConfig {
  baseUrl?: string;
  modelName?: string;
  defaultTimeoutMs?: number;
}

export class OllamaAdapter implements AICompletionProvider {
  public readonly name = 'Ollama Local Adapter';
  public readonly providerType: AIProviderType = 'ollama';

  private baseUrl: string;
  private modelName: string;
  private defaultTimeoutMs: number;

  constructor(config?: OllamaAdapterConfig) {
    this.baseUrl = (config?.baseUrl || process.env.AI_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
    this.modelName = config?.modelName || process.env.AI_MODEL_NAME || 'qwen2.5:7b';
    this.defaultTimeoutMs = config?.defaultTimeoutMs || 30000;
  }

  public async generateText(prompt: string, options?: AIOptions): Promise<string> {
    const timeout = options?.timeoutMs || this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // First try OpenAI-compatible endpoint at Ollama: /v1/chat/completions
      // Fallback to /api/chat if /v1 isn't available
      const url = `${this.baseUrl}/api/chat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.2,
          },
        }),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok) {
        // Fallback to /v1/chat/completions
        const v1Url = `${this.baseUrl}/v1/chat/completions`;
        const v1Response = await fetch(v1Url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.modelName,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
            temperature: options?.temperature ?? 0.2,
          }),
          signal: options?.signal || controller.signal,
        });

        if (!v1Response.ok) {
          const err = await v1Response.text().catch(() => '');
          throw new Error(`Ollama request failed: ${err.substring(0, 100)}`);
        }

        const v1Data = await v1Response.json();
        return v1Data?.choices?.[0]?.message?.content || '';
      }

      const data = await response.json();
      const content = data?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Ollama returned empty or invalid response content');
      }

      return content;
    } catch (err: any) {
      safeLogError('OllamaAdapter.generateText error', err);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const url = `${this.baseUrl}/api/version`;

      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }
}
