// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Represents a generic identifier for a Large Language Model (LLM).
 *
 * `LLMModel` is defined as a string type to provide flexibility when working
 * with different LLM providers, each of which may define its own model naming
 * conventions (e.g., `'gpt-4'`, `'gpt-4o'`, `'claude-3-opus'`).
 *
 * This abstraction allows the system to remain provider-agnostic while still
 * supporting a wide range of models across different vendors.
 *
 * Although this type is currently a simple alias of `string`, it serves as a
 * semantic contract that improves readability and enables future evolution,
 * such as:
 *
 * - Restricting models to a predefined union of supported values
 * - Introducing branded types for stronger type safety
 * - Mapping models to provider-specific configurations
 *
 * Typical usage:
 *
 * ```ts
 * const model: LLMModel = 'gpt-4';
 *
 * if (provider.supports(model)) {
 *   // Safe to use the model with the selected provider
 * }
 * ```
 */
export type LLMModel = string;

/**
 * Represents a base abstraction for a Large Language Model (LLM) provider.
 *
 * The `LLMProvider` defines a common interface and shared behavior for all
 * LLM providers (e.g., OpenAI, Anthropic). It enforces a consistent structure
 * for identifying providers and validating supported models, while allowing
 * concrete implementations to define their own capabilities.
 *
 * Each provider must specify:
 * - A unique `name` used for identification and routing.
 * - A list of `supportedModels` that the provider can handle.
 *
 * This abstraction enables:
 * - Provider-agnostic orchestration (e.g., selecting a provider at runtime)
 * - Centralized validation of model compatibility
 * - Extensibility for adding new providers without modifying existing logic
 *
 * Typical usage:
 *
 * ```ts
 * const provider = new OpenAIProvider();
 *
 * if (provider.supports('gpt-4')) {
 *   // Safe to execute request with this provider
 * }
 * ```
 *
 * Subclasses should extend `LLMProvider` and provide concrete implementations
 * for `name` and `supportedModels`.
 */
export abstract class LLMProvider {
  /**
   * A unique identifier for the provider.
   *
   * This value is typically used for routing requests, logging, and
   * selecting the appropriate provider at runtime.
   *
   * Example: `'openai'`, `'anthropic'`
   */
  abstract readonly name: string;

  /**
   * The list of models supported by this provider.
   *
   * This property defines which models can be used when interacting
   * with the provider. It is kept `protected` to prevent external
   * mutation while allowing subclasses to define their capabilities.
   *
   * Example: `['gpt-4', 'gpt-4o']`
   */
  protected abstract readonly supportedModels: readonly LLMModel[];

  /**
   * Determines whether the given model is supported by this provider.
   *
   * This method performs a simple membership check against the provider's
   * declared `supportedModels`. It is intended to be used before executing
   * any model-specific operations to ensure compatibility.
   *
   * - Parameter model: The model identifier to validate.
   *
   * - Returns: `true` if the model is supported by the provider;
   *            otherwise, `false`.
   *
   * Example:
   *
   * ```ts
   * provider.supports('gpt-4'); // true
   * provider.supports('unknown-model'); // false
   * ```
   */
  supports(model: LLMModel): boolean {
    return this.supportedModels.includes(model);
  }
}
  
/**
 * A concrete implementation of {@link LLMProvider} for the Anthropic platform.
 *
 * The `AnthropicProvider` defines the set of models supported by Anthropic
 * and leverages the shared behavior from `LLMProvider` to validate model
 * compatibility via the `supports` method.
 *
 * This provider is responsible for:
 * - Identifying itself using a unique `name`
 * - Declaring the models available within the Anthropic ecosystem
 *
 * By extending `LLMProvider`, this class integrates with provider-agnostic
 * orchestration layers, enabling dynamic selection and validation of models
 * at runtime.
 *
 * Typical usage:
 *
 * ```ts
 * const provider = new AnthropicProvider();
 *
 * provider.supports('claude-3'); // true
 * provider.supports('gpt-5.4'); // false
 * ```
 */
export class AnthropicProvider extends LLMProvider {
  /**
   * A unique identifier for the provider.
   *
   * This value is typically used for routing requests, logging, and
   * selecting the appropriate provider at runtime.   
   */
  readonly name = 'anthropic';

  /**
   * The list of models supported by this provider.
   *
   * This property defines which models can be used when interacting
   * with the provider. It is kept `protected` to prevent external
   * mutation while allowing subclasses to define their capabilities.   
   */
  protected readonly supportedModels = ['claude-3', 'claude-3-opus'] as const;
}

/**
 * A concrete implementation of {@link LLMProvider} for the OpenAI platform.
 *
 * The `OpenAIProvider` defines the set of models supported by OpenAI and
 * provides a consistent interface for validating model compatibility through
 * the inherited `supports` method.
 *
 * This provider is responsible for:
 * - Identifying itself using a unique `name`
 * - Declaring the models available for use within the OpenAI ecosystem
 *
 * By extending `LLMProvider`, this class integrates seamlessly with
 * provider-agnostic orchestration layers, enabling dynamic provider selection
 * and validation at runtime.
 *
 * Typical usage:
 *
 * ```ts
 * const provider = new OpenAIProvider();
 *
 * provider.supports('gpt-5.4'); // true
 * provider.supports('claude-3'); // false
 * ```
 */
class OpenAIProvider extends LLMProvider {
  /**
   * A unique identifier for the provider.
   *
   * This value is typically used for routing requests, logging, and
   * selecting the appropriate provider at runtime.   
   */
  readonly name = 'openai';

  /**
   * The list of models supported by this provider.
   *
   * This property defines which models can be used when interacting
   * with the provider. It is kept `protected` to prevent external
   * mutation while allowing subclasses to define their capabilities.
   *
   * Example: `['gpt-4', 'gpt-4o']`
   */
  protected readonly supportedModels = [
      'gpt-5.4', 
      'gpt-5.4-mini', 
      'gpt-5.4-turbo'
    ];
}

export const LLM_PROVIDERS = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
} as const;