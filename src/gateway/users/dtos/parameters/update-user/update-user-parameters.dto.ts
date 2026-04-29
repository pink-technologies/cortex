// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  IsDefined,
  IsNotEmpty,
  IsPhoneNumber,
  Matches,
} from 'class-validator';

/**
 * Data Transfer Object representing the parameters required to
 * update a user's profile.
 */
export class UpdateUserParametersDto {
  /**
   * The user's given first name.
   */
  @IsDefined({ message: 'First name is required.' })
  @IsNotEmpty({ message: 'First name cannot be empty.' })
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/, {
    message: 'First name must contain only letters.',
  })
  firstName: string;

  /**
   * The user's last name.
   */
  @IsDefined({ message: 'Last name is required.' })
  @IsNotEmpty({ message: 'Last name cannot be empty.' })
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/, {
    message: 'Last name must contain only letters.',
  })
  lastName: string;

  /**
   * The user's phone number.
   */
  @IsDefined({ message: 'Phone is required.' })
  @IsNotEmpty({ message: 'Phone cannot be empty.' })
  @IsPhoneNumber(undefined, { message: 'Please enter a valid phone number.' })
  phone: string;
}
