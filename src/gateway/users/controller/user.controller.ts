// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { UserExceptionFilter } from '../filter/exception.filter';
import { UserService } from '../service/user.service';
import { UserResponseDto } from '../dtos/responses/user/user-response.dto';
import { UpdateUserParametersDto } from '../dtos/parameters';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    Put,
    Req,
    UseFilters,
} from '@nestjs/common';

/**
 * HTTP controller responsible for handling user-related requests.
 *
 * This controller acts as the transport-layer entry point for authentication
 * operations and delegates all business logic to the
 * {@link UserService}.
 */
@Controller()
@UseFilters(UserExceptionFilter)
export class UserController {
    // MARK: - Constructor

    /**
     * Creates a new {@link UserController}.
     *
     * @param userService - Application service responsible for
     * orchestrating user-related operations such as lookup and updates.
     */
    constructor(private readonly userService: UserService) { }

    // MARK: - Instance methods

    /**
     * Retrieves the current user's profile.
     *
     * @returns The current user's profile.
     */
    @HttpCode(200)
    @Get('users/me')
    async me(@Req() req: Request): Promise<UserResponseDto> {
        const user = (req as any).user;

        const existingUser = await this.userService.findByEmail(user.email);

        return UserResponseDto.from(existingUser);
    }

    /**
     * Updates a user's profile fields.
     *
     * @param id - The unique identifier of the user.
     * @param body - The profile fields to update.
     * @returns The updated user entity.
     */
    @HttpCode(200)
    @Put('users/me')
    async update(
        @Req() req: Request,
        @Body() body: UpdateUserParametersDto
    ): Promise<UserResponseDto> {
        const user = (req as any).user;

        const updatedUser = await this.userService.update(user.id, body);

        return UserResponseDto.from(updatedUser);
    }
}
