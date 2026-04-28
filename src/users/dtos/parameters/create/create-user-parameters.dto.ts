// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Parameters required to create a new user record in the application domain.
 *
 * This type represents the normalized input required by the
 * application or domain layer to persist a user profile after
 * successful authentication or sign-up.
 *
 * Unlike transport-level DTOs, this type is free of validation
 * decorators and assumes that all values have already been
 * validated and normalized at the API boundary.
 */
export type CreateUserParametersDto = {
  /**
   * The user's given (first) name.
   *
   * This value represents the user's personal profile information
   * and may be used for display or communication purposes.
   */
  firstName: string;

  /**
   * The email address associated with the user account.
   *
   * This value is expected to be a valid email and normalized
   * (e.g. lowercased and trimmed) prior to persistence.
   */
  email: string;

  /**
   * The user's family (last) name.
   *
   * This value represents the user's personal profile information
   * and may be used for display or communication purposes.
   */
  lastName: string;

  /**
   * The user's phone number.
   *
   * This value is typically used for account recovery, verification,
   * or communication purposes and is expected to be normalized
   * before being stored.
   */
  phone: string;
};
