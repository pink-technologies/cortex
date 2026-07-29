// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind } from './content-kind'

/**
 * Image block inside {@link LLMMessage.content}.
 *
 * Discriminated by {@link ContentKind.Image}. Typically used on user turns for
 * vision models. Provider adapters encode {@link source} into vendor-specific
 * image parts (for example OpenAI `image_url` data URLs or Anthropic image
 * blocks).
 *
 * Today only inline base64 sources are supported; URL or provider file-id
 * carriers can be added later without changing {@link ContentKind.Image}.
 */
export interface ImageContent {
  /** Discriminant; always {@link ContentKind.Image}. */
  readonly type: typeof ContentKind.Image

  /**
   * Image payload carrier.
   *
   * Currently limited to inline base64 bytes. Adapters must not assume a
   * `data:` URL prefix unless they strip or add it themselves.
   */
  readonly source: {
    /**
     * Base64-encoded image bytes.
     *
     * Raw base64 without a `data:` URL scheme is preferred.
     */
    readonly data: string

    /**
     * IANA media type of the decoded image.
     *
     * Examples: `image/png`, `image/jpeg`, `image/webp`, `image/gif`.
     */
    readonly mediaType: string

    /**
     * Encoding discriminator for this carrier.
     *
     * Always `'base64'` for the current source shape.
     */
    readonly type: 'base64'
  }
}
