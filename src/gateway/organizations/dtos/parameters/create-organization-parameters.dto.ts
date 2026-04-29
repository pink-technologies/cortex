// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for organization creation request input.
 *
 * Used at the controller boundary (e.g. HTTP request body) to validate and type
 * input for organization creation. The service maps this to
 * {@link CreateOrganizationParameters} (e.g. adding ownerId from the authenticated
 * user) before calling the repository.
 *
 * Validation ensures the organization name is present and non-empty.
 */
export class CreateOrganizationParametersDto {
  /**
   * The name of the organization.
   *
   * This value represents the display name of the organization and is
   * typically shown to users in the application interface.
   */
  @IsNotEmpty({ message: 'The organization name is required.' })
  name: string;
}
