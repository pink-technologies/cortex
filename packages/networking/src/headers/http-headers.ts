// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Case-insensitive HTTP header store used when building requests and reading
 * responses.
 *
 * Header names are normalized to lowercase on write and lookup, so
 * `Content-Type` and `content-type` refer to the same entry. Values are stored
 * as supplied; this type does not combine multi-value headers.
 */
export class HTTPHeaders {
  // MARK: - Properties

  private readonly values = new Map<string, string>()

  // MARK: - Constructor

  /**
   * Creates an empty header store, optionally seeded from an existing map.
   *
   * When `initial` is provided, each entry is copied with its name lowercased.
   * If the seed contains names that differ only by case, the last copied value
   * wins. Passing another {@link HTTPHeaders} copies its current entries.
   *
   * @param initial - Optional plain record, Fetch {@link Headers}, or
   *   {@link HTTPHeaders} to copy from.
   */
  constructor(initial?: Record<string, string> | Headers | HTTPHeaders) {
    if (!initial) {
      return
    }

    if (initial instanceof HTTPHeaders) {
      for (const [key, value] of initial.values) {
        this.values.set(key, value)
      }
      return
    }

    if (typeof Headers !== 'undefined' && initial instanceof Headers) {
      initial.forEach((value, key) => {
        this.values.set(key.toLowerCase(), value)
      })
      return
    }

    for (const [key, value] of Object.entries(initial)) {
      this.values.set(key.toLowerCase(), value)
    }
  }

  // MARK: - Instance methods

  /**
   * Returns a new store with the same header entries.
   *
   * Mutations on the copy do not affect this instance.
   *
   * @returns Independent {@link HTTPHeaders} with equivalent contents.
   */
  clone(): HTTPHeaders {
    return new HTTPHeaders(this)
  }

  /**
   * Removes a header when present.
   *
   * The name is matched case-insensitively. Removing a missing header is a
   * no-op.
   *
   * @param name - Header name to remove.
   * @returns This instance for chaining.
   */
  delete(name: string): this {
    this.values.delete(name.toLowerCase())
    return this
  }

  /**
   * Returns the value for a header when present.
   *
   * The name is matched case-insensitively.
   *
   * @param name - Header name to look up.
   * @returns Stored value, or `undefined` when the header is absent.
   */
  get(name: string): string | undefined {
    return this.values.get(name.toLowerCase())
  }

  /**
   * Reports whether a header is present.
   *
   * The name is matched case-insensitively.
   *
   * @param name - Header name to look up.
   * @returns `true` when a value is stored for {@link name}.
   */
  has(name: string): boolean {
    return this.values.has(name.toLowerCase())
  }

  /**
   * Copies headers from another map into this store.
   *
   * Names already present are overwritten by values from {@link other}.
   * Names from {@link other} are normalized to lowercase.
   *
   * @param other - Plain record or {@link HTTPHeaders} to merge in.
   * @returns This instance for chaining.
   */
  merge(other: Record<string, string> | HTTPHeaders): this {
    const source = other instanceof HTTPHeaders ? other.toRecord() : other
    for (const [key, value] of Object.entries(source)) {
      this.set(key, value)
    }
    return this
  }

  /**
   * Sets or replaces a header value.
   *
   * The name is stored lowercase. Any previous value for the same name is
   * replaced.
   *
   * @param name - Header name.
   * @param value - Header value.
   * @returns This instance for chaining.
   */
  set(name: string, value: string): this {
    this.values.set(name.toLowerCase(), value)
    return this
  }

  /**
   * Returns the headers as a plain object for transport APIs such as `fetch`.
   *
   * Keys in the record are the stored lowercase names.
   *
   * @returns Snapshot of the current name/value pairs.
   */
  toRecord(): Record<string, string> {
    return Object.fromEntries(this.values.entries())
  }
}
