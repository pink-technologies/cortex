// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  CodeMismatchException,
  ExpiredCodeException,
  InvalidParameterException,
  InvalidPasswordException,
  NotAuthorizedException,
  PasswordResetRequiredException,
  UsernameExistsException,
  UserNotConfirmedException,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';

import {
  AuthenticatableError,
  InvalidCodeError,
  InvalidCredentialsError,
  InvalidParametersError,
  InvalidPasswordError,
  NewPasswordRequiredError,
  ProviderUserAlreadyExistsError,
  ProviderUserNotFoundError,
  UserIsNotConfirmedError,
} from '../error/authenticatable-error';

/**
 * Parameters used to map a low-level authentication error into a
 * normalized {@link AuthenticatableError}.
 */
type MapErrorParams = {
  /**
   * The original error thrown by the authentication provider, SDK,
   * or underlying infrastructure.
   */
  error: unknown;

  /**
   * Fallback error to be returned when the provided error cannot be
   * mapped to a more specific {@link AuthenticatableError}.
   *
   * This allows callers to explicitly control the default error
   * behavior for a given authentication operation.
   */
  fallback: AuthenticatableError;
};

/**
 * Utility responsible for translating provider- or infrastructure-level
 * errors into normalized {@link AuthenticatableError} instances.
 *
 * This mapper acts as a boundary layer that prevents provider-specific
 * error types from leaking into the application or domain layers.
 *
 * Responsibilities:
 * - normalize heterogeneous error types into a stable auth error taxonomy,
 * - provide deterministic error mapping behavior,
 * - ensure a fallback error is always returned when no specific mapping applies.
 *
 * This utility does not perform logging or error throwing; it is purely
 * responsible for error translation.
 */
export class ErrorMapper {
  /**
   * Maps a low-level error to a normalized {@link AuthenticatableError}.
   *
   * The provided error is inspected and translated into the most
   * appropriate domain-level authentication error. If the error
   * type is not recognized, the supplied fallback error is returned.
   *
   * @param params - Mapping parameters including the original error
   * and the fallback error to use when no mapping is found.
   * @returns A normalized {@link AuthenticatableError} instance.
   */
  static map({ error, fallback }: MapErrorParams): AuthenticatableError {
    if (error instanceof CodeMismatchException || error instanceof ExpiredCodeException) {
      return new InvalidCodeError(error);
    }

    if (error instanceof InvalidParameterException) {
      return new InvalidParametersError(error);
    }

    if (error instanceof InvalidPasswordException) {
      return new InvalidPasswordError(error);
    }

    if (error instanceof NotAuthorizedException) {
      return new InvalidCredentialsError(error);
    }

    if (error instanceof PasswordResetRequiredException) {
      return new NewPasswordRequiredError(error);
    }

    if (error instanceof UsernameExistsException) {
      return new ProviderUserAlreadyExistsError(error);
    }

    if (error instanceof UserNotFoundException) {
      return new ProviderUserNotFoundError(error);
    }

    if (error instanceof UserNotConfirmedException) {
      return new UserIsNotConfirmedError(error);
    }

    return fallback;
  }
}
