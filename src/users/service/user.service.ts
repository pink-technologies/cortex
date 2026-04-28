// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Database, User, type UserStatus } from '@/infraestructure/database';
import { I18nService } from '@/i18n/i18n.service';
import { Injectable } from "@nestjs/common";
import { UserRepository } from "../repository/users.repository";
import { UserNotFoundError, UserStatusUnchangedError } from "./error/user.error";
import { UpdateUserParametersDto } from "../dtos/parameters";

@Injectable()
export class UserService {
    // MARK: - Constructor

    /**
     * Creates a new {@link UserService}.
     *
     * @param database - The database client used to run transactions. Injected at
     * runtime to support inversion of control and enable testability.
     * @param i18nService - The i18n service used to resolve localized messages
     * for user-facing responses (e.g. organization names, error messages).
     * @param usersRepository - The repository responsible for user persistence
     * and lookup operations.
     */
    constructor(
        private readonly database: Database,
        private readonly i18nService: I18nService,
        private readonly userRepository: UserRepository
    ) { }

    // MARK: - Instance methods

    /**
     * Finds a user by email.
     *
     * @param email - The email address to look up.
     * @returns The matching user or null if not found.
     */
    async findByEmail(email: string): Promise<User> {
        const user = await this.userRepository.findByEmail(email);

        if (!user) throw new UserNotFoundError;

        return user;
    }

    /**
     * Finds a user by unique identifier.
     *
     * @param userId - The user ID to look up.
     * @returns The matching user entity.
     *
     * @throws UserNotFoundError when the user cannot be found.
     */
    async findById(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);

        if (!user) throw new UserNotFoundError;

        return user;
    }

    /**
     * Checks whether a phone number is already registered.
     *
     * @param phone - The phone number to validate.
     * @returns A status object describing whether the phone is registered.
     */
    async isPhoneRegistered(
        phone: string,
    ): Promise<{ message: string }> {
        const registered = await this.userRepository.isPhoneRegistered(phone);

        return {
            message: registered ? this.i18nService.user.phoneRegistered()
                : this.i18nService.user.phoneNotRegistered(),
        };
    }

    /**
     * Updates a user's profile fields.
     *
     * @param userId - The unique identifier of the user.
     * @param parameters - The fields to update.
     * @returns The updated user entity.
     */
    async update(userId: string, parameters: UpdateUserParametersDto): Promise<User> {
        const user = await this.userRepository.findById(userId);

        if (!user) throw new UserNotFoundError;

        return await this.userRepository.update(userId, parameters);
    }

    /**
     * Updates the status of a user account.
     *
     * @param userId - The unique identifier of the user.
     * @param status - The new user status to persist.
     * @returns The updated user entity.
     */
    async updateStatus(userId: string, status: UserStatus): Promise<User> {
        const user = await this.userRepository.findById(userId);

        if (!user) throw new UserNotFoundError;

        if (user.status === status) throw new UserStatusUnchangedError;

        return await this.userRepository.updateStatus(userId, status);
    }
}
