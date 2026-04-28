// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsDefined, IsEnum } from 'class-validator';
import { UserStatus } from '@prisma/client';

/**
 * Data Transfer Object representing the parameters required to
 * update a user's status.
 */
export class UpdateUserStatusParametersDto {
  /**
   * The new status to apply to the user.
   */
  @IsDefined({ message: 'Status is required.' })
  @IsEnum(UserStatus, { message: 'Status must be a valid user status.' })
  status: UserStatus;
}
