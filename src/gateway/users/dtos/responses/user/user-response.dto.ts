// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { User, UserProfile } from '@/infraestructure/database';
import { UserProfileResponseDto } from '../profile/user-profile-response.dto';

/**
 * Data Transfer Object representing a user response with
 * null values normalized to empty strings where appropriate.
 * {@link deletedAt} and {@link profile} are omitted when not applicable.
 */
export class UserResponseDto {
  /**
   * Unique identifier of the user.
   */
  readonly id: string;

  /**
   * ISO timestamp when the user was created.
   */
  readonly createdAt: string;

  /**
   * ISO timestamp when the user was soft-deleted.
   * Omitted in JSON when the user is not deleted.
   */
  readonly deletedAt?: string | null;

  /**
   * Email address associated with the user account.
   */
  readonly email: string;

  /**
   * The user's given (first) name.
   */
  readonly firstName: string;

  /**
   * The user's profile.
   * Omitted when there is no profile row or it was not loaded.
   */
  readonly profile: UserProfileResponseDto | null;

  /**
   * The user's family (last) name.
   */
  readonly lastName: string;

  /**
   * The current user status.
   */
  readonly status: string;

  /**
   * ISO timestamp when the user was last updated.
   */
  readonly updatedAt: string;

  // MARK: - Static methods

  /**
   * Creates a {@link UserResponseDto} from a domain user entity.
   */
  static from(user: User & { profile?: UserProfile | null }): UserResponseDto {
    return {
      id: user.id,
      createdAt: user.createdAt?.toISOString() ?? '',
      deletedAt: user.deletedAt?.toISOString() ?? null,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      status: user.status ?? '',
      profile: user.profile ? UserProfileResponseDto.from(user.profile) : null,
      updatedAt: user.updatedAt?.toISOString() ?? '',
    };
  }
}
