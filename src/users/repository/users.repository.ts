// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Database, User} from '@/infraestructure/database';
import { UserStatus } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { CreateUserParametersDto, UpdateUserParametersDto } from '../dtos/parameters/';
import { UserNotFoundError } from '../service/error/user.error';

/**
 * Repository responsible for persisting and querying {@link User} entities.
 *
 * ## Responsibilities
 * - Encapsulates all database access patterns for User entities
 * - Maps Prisma query shapes to semantic, domain-aware method names
 * - Ensures that application services remain agnostic about persistence details
 * - Provides a single point of change if persistence layer needs to evolve
 *
 * ## Design Principles
 * - Each method has a single, well-defined responsibility
 * - Method names clearly express intent (e.g., `isPhoneRegistered` vs generic `find`)
 * - All input is assumed to be normalized before reaching the repository
 * - The repository returns domain entities, not raw Prisma models
 *
 * ## Usage
 * This repository is injected into application services that need to perform
 * user-related database operations. Services remain decoupled from Prisma
 * by depending on this abstraction instead of directly using the Database class.
 *
 * @example
 * ```typescript
 * constructor(private readonly usersRepository: UsersRepository) {}
 *
 * async signUp(params: SignupParametersDto): Promise<void> {
 *   const exists = await this.usersRepository.findByEmail(params.email);
 *   if (exists) throw new UserAlreadyRegisteredError();
 *
 *   const user = await this.usersRepository.create({
 *     email: params.email,
 *     firstName: params.firstName,
 *     lastName: params.lastName,
 *     phone: params.phone,
 *   });
 * }
 * ```
 */
@Injectable()
export class UserRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link UserRepository}.
     *
     * @param database - The database client used to perform user operations.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods


    /**
     * Creates a new user record in the "pending provider registration" state.
     *
     * This method creates an application-level user record without connecting it
     * to the authentication provider yet. The user's status is set to
     * {@link UserStatus.PendingProviderRegistration}, indicating that the user
     * record exists but the authentication provider registration is still pending.
     *
     * Typically, this is the first step in the sign-up flow. After the authentication
     * provider (e.g., Cognito) successfully registers the user, the status should
     * be updated to {@link UserStatus.PendingConfirmation}.
     *
     * All input data (email, phone) is expected to be normalized before being passed
     * to this method.
     *
     * @param parameters - The parameters required to create the user.
     * @returns The newly created {@link User} entity.
     *
     * @throws {DatabaseEntityConflictError} if the email or phone already exists
     * (assuming unique constraints are enforced in the database schema).
     * @throws {DatabaseError} if any other database operation fails.
     *
     * @example
     * ```typescript
     * const user = await usersRepository.create({
     *   email: 'john@example.com',
     *   firstName: 'John',
     *   lastName: 'Doe',
     *   phone: '+1234567890',
     * });
     * // User is created with status: PendingProviderRegistration
     * ```
     */
    async create(parameters: CreateUserParametersDto): Promise<User> {
        return this.database.user.create({
            data: {
                email: parameters.email,
                firstName: parameters.firstName,
                lastName: parameters.lastName,
                profile: {
                    create: {
                        phoneNumber: parameters.phone,
                    },
                },
                status: UserStatus.ACTIVE,
            },
        });
    }

    /**
     * Finds a user by email address.
     *
     * This method queries the user table by email, which is a unique identifier.
     * The email is expected to be normalized (lowercased and trimmed) before being
     * passed to this method. Normalization should occur at the API boundary.
     *
     * @param email - The normalized email address to search for.
     * @returns The {@link User} entity if found, or null if no user exists with this email.
     *
     * @example
     * ```typescript
     * const user = await usersRepository.findByEmail('john@example.com');
     * if (!user) {
     *   throw new UserNotFoundError();
     * }
     * ```
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.database.user.findUnique({
            where: { email },
            include: { profile: true },
        });
    }

    /**
     * Finds a user by unique identifier.
     *
     * @param userId - The user ID to look up.
     * @returns The {@link User} entity if found, or null otherwise.
     */
    async findById(userId: string): Promise<User | null> {
        return this.database.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
    }

    /**
     * Checks whether a phone number is already registered to any user.
     *
     * This method uses a count query rather than fetching full user records
     * to avoid unnecessary data retrieval and to preserve privacy (no user
     * information is exposed).
     *
     * The phone number is expected to be normalized before being passed to
     * this method. Normalization should occur at the API boundary.
     *
     * @param phone - The normalized phone number to check.
     * @returns true if the phone number is already registered, false otherwise.
     *
     * @example
     * ```typescript
     * const isRegistered = await usersRepository.isPhoneRegistered('+1234567890');
     * if (isRegistered) {
     *   throw new PhoneAlreadyRegisteredError();
     * }
     * ```
     */
    async isPhoneRegistered(phone: string): Promise<boolean> {
        const count = await this.database.user.count({
            where: { profile: { phoneNumber: phone } },
        });

        return count > 0;
    }

    /**
     * Updates a user record with the provided fields.
     *
     * @param userId - The unique identifier of the user to update.
     * @param parameters - The fields to update.
     * @returns The updated {@link User} entity.
     */
    async update(userId: string, parameters: UpdateUserParametersDto): Promise<User> {
        return this.database.$transaction(async (database) => {
            const user = await database.user.findFirst({
                where: { id: userId, deletedAt: null },
            });

            if (!user) throw new UserNotFoundError();

            return database.user.update({
                where: { id: user.id },
                data: {
                    firstName: parameters.firstName,
                    lastName: parameters.lastName,
                    profile: {
                        update: {
                            phoneNumber: parameters.phone,
                        },
                    },
                },
                include: { profile: true },
            });
        });
    }

    /**
     * Updates the status of a user.
     *
     * This method directly updates a user's status to the provided value. It is
     * a low-level operation that should be used when the status transition is
     * straightforward and doesn't require additional business logic.
     *
     * Common use cases include:
     * - Transitioning from {@link UserStatus.PendingProviderRegistration} to
     *   {@link UserStatus.PendingConfirmation} after successful provider registration
     * - Activating a user account by setting status to {@link UserStatus.Active}
     * - Deactivating a user account by setting status to {@link UserStatus.Inactive}
     *
     * @param userId - The unique identifier of the user to update.
     * @param status - The new {@link UserStatus} value.
     * @returns The updated {@link User} entity with the new status reflected.
     *
     * @throws {Error} if the user does not exist, the status is unchanged,
     * or if the update fails.
     *
     * @example
     * ```typescript
     * // Mark user as pending confirmation after provider registration
     * await userRepository.updateStatus(
     *   userId,
     *   UserStatus.PendingConfirmation
     * );
     *
     * // Activate a user account
     * await usersRepository.updateStatus(userId, UserStatus.Active);
     * ```
     */
    async updateStatus(userId: string, status: UserStatus): Promise<User> {
        return this.database.user.update({
            where: { id: userId },
            data: { status },
            include: { profile: true },
        });
    }
}
