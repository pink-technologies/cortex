// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { UserProfile } from "@/infraestructure/database";

/**
 * Data Transfer Object representing a user profile response.
 */
export class UserProfileResponseDto {
  /**
   * Unique identifier of the user profile.
   */
  readonly id: string;

  /**
   * Date and time when the user profile was created.
   */
  readonly createdAt: Date;

  /**
   * The user's profile picture URL, or empty when absent.
   */
  readonly profilePictureUrl: string | null;

  /**
   * The user's phone number, or empty when absent.
   */
  readonly phoneNumber: string | null;

  /**
   * The user's timezone, or empty when absent.
   */
  readonly timezone: string | null;

  /**
   * The user's locale, or empty when absent.
   */
  readonly locale: string | null;

  /**
   * The user's phone verified at date and time, or empty when absent.
   */
  readonly phoneVerifiedAt: Date | null;

  /**
   * ISO timestamp when the user profile was last updated.
   */
    readonly updatedAt: string | null;

    // MARK: - Static methods

  /**
   * Creates a {@link UserResponseDto} from a domain user entity.
   */
  static from(profile: UserProfile): UserProfileResponseDto {
    return {
      id: profile.id,
      createdAt: profile.createdAt,
      profilePictureUrl: profile.profilePictureUrl,
      phoneNumber: profile.phoneNumber,
      timezone: profile.timezone,
      locale: profile.locale,
      phoneVerifiedAt: profile.phoneVerifiedAt,
      updatedAt: profile.updatedAt?.toISOString() ?? null,
    };
  }
}