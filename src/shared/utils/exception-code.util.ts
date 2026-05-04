// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Extracts the exception code from an arbitrary thrown value.
 * Used by module exception filters to propagate stable machine-readable codes.
 *
 * @param exception - The exception to extract the code from.
 * @returns The exception code or undefined if not present.
 */
export function getExceptionCode(exception: unknown): string | undefined {
    if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof (exception as { code: unknown }).code === 'string'
    ) {
      return (exception as { code: string }).code;
    }
  
    return undefined;
  }
  