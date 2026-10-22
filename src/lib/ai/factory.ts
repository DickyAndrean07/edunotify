import { AICompletionProvider, AIProviderConfig, AIProviderType } from './types';
import { NineRouterAdapter } from './adapters/nineRouterAdapter';
import { OpenAIAdapter } from './adapters/openAIAdapter';
import { OllamaAdapter } from './adapters/ollamaAdapter';
import { AnthropicAdapter } from './adapters/anthropicAdapter';
import { safeLogInfo } from './sanitizer';

let customProviderInstance: AICompletionProvider | null = null;

/**
 * Register a custom/mock provider instance (useful for unit tests & sandbox testing)
 */
export function setMockAIProvider(provider: AICompletionProvider | null): void {
  customProviderInstance = provider;
}

/**
 * Creates or retrieves the configured AI Completion Provider according to environment variables.
 */
export function getAIProvider(overrideConfig?: Partial<AIProviderConfig>): AICompletionProvider {
  if (customProviderInstance) {
    return customProviderInstance;
  }

  const providerType: AIProviderType = (
    overrideConfig?.provider ||
    (process.env.AI_PROVIDER as AIProviderType) ||
    '9router'
  ).toLowerCase() as AIProviderType;

  safeLogInfo(`Initializing AI provider: ${providerType}`);

  switch (providerType) {
    case 'openai':
      return new OpenAIAdapter({
        baseUrl: overrideConfig?.baseUrl,
        apiKey: overrideConfig?.apiKey,
        modelName: overrideConfig?.modelName,
        defaultTimeoutMs: overrideConfig?.timeoutMs,
      });

    case 'ollama':
      return new OllamaAdapter({
        baseUrl: overrideConfig?.baseUrl,
        modelName: overrideConfig?.modelName,
        defaultTimeoutMs: overrideConfig?.timeoutMs,
      });

    case 'anthropic':
      return new AnthropicAdapter({
        baseUrl: overrideConfig?.baseUrl,
        apiKey: overrideConfig?.apiKey,
        modelName: overrideConfig?.modelName,
        defaultTimeoutMs: overrideConfig?.timeoutMs,
      });

    case '9router':
    default:
      return new NineRouterAdapter({
        baseUrl: overrideConfig?.baseUrl,
        apiKey: overrideConfig?.apiKey,
        modelName: overrideConfig?.modelName,
        defaultTimeoutMs: overrideConfig?.timeoutMs,
      });
  }
}
