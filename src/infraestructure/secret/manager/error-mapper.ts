// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  SecretsManagerServiceException,
  InvalidParameterException,
  InvalidRequestException,
  ResourceNotFoundException,
} from '@aws-sdk/client-secrets-manager'
import {
  CreateSecretError,
  GetSecretByRefError,
  SecretManagerError,
  UpdateSecretError
} from '../error/secret-manager.error'

/**
 * Parameters used to map a low-level secret manager error into a
 * normalized {@link SecretManagerError}.
 */
type MapErrorParams = {
  /**
   * The original error thrown by the secret manager provider, SDK,
   * or underlying infrastructure.
   */
  error: unknown

  /**
   * Fallback error to be returned when the provided error cannot be
   * mapped to a more specific {@link SecretManagerError}.
   *
   * This allows callers to explicitly control the default error
   * behavior for a given secret manager operation.
   */
  fallback: SecretManagerError
};

/**
 * Utility responsible for translating provider- or infrastructure-level
 * errors into normalized {@link SecretManagerError} instances.
 *
 * This mapper acts as a boundary layer that prevents provider-specific
 * error types from leaking into the application or domain layers.
 *
 * Responsibilities:
 * - normalize heterogeneous error types into a stable secret manager error taxonomy,
 * - provide deterministic error mapping behavior,
 * - ensure a fallback error is always returned when no specific mapping applies.
 *
 * This utility does not perform logging or error throwing; it is purely
 * responsible for error translation.
 */
export class ErrorMapper {
  /**
   * Maps a low-level error to a normalized {@link SecretManagerError}.
   *
   * The provided error is inspected and translated into the most
   * appropriate domain-level secret manager error. If the error
   * type is not recognized, the supplied fallback error is returned.
   *
   * @param params - Mapping parameters including the original error
   * and the fallback error to use when no mapping is found.
   * 
   * @returns A normalized {@link SecretManagerError} instance.
   */
  static map({ error, fallback }: MapErrorParams): SecretManagerError {
    if (error instanceof SecretsManagerServiceException) {
      return new CreateSecretError(error)
    }

    if (error instanceof ResourceNotFoundException) {
      return new GetSecretByRefError(error)
    }

    if (
      error instanceof InvalidParameterException ||
      error instanceof InvalidRequestException
    ) {
      return new UpdateSecretError(error)
    }

    return fallback
  }
}
