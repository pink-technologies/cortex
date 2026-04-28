// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
    Body,
    Controller,
    Get,
    HttpCode,
    Patch,
    Put,
    Req,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { UserExceptionFilter } from '../filter/exception.filter';
import { UserService } from '../service/user.service';
import { AuthenticatorGuard } from '../guards/authenticator.guard';
import {
    IsPhoneRegisteredDto,
    UpdateUserParametersDto,
    UpdateUserStatusDto
} from '../dtos/parameters';
import { UserResponseDto } from '../dtos/responses/user/user-response.dto';

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
     * Retrieves a user by email address.
     *
     * @param email - The email address to look up.
     * @returns The matching user entity.
     *
     * @throws HttpException when the user cannot be found or
     * the request cannot be processed.
     */
    @UseGuards(AuthenticatorGuard)
    @HttpCode(200)
    @Get('users/me')
    async findByEmail(@Req() req: Request): Promise<UserResponseDto> {
        const user = (req as any).user;

        const foundUser = await this.userService.findByEmail(user.email);

        return UserResponseDto.from(foundUser);
    }

    /**
     * Checks whether a phone number is already registered.
     *
     * @param phone - The phone number to validate.
     * @returns A status object indicating whether the phone is registered.
     */
    @UseGuards(AuthenticatorGuard)
    @HttpCode(200)
    @Get('users/phone/registered')
    async isPhoneRegistered(
        @Body() body: IsPhoneRegisteredDto,
    ): Promise<{ message: string }> {
        return await this.userService.isPhoneRegistered(body.phone);
    }

    /**
     * Updates a user's profile fields.
     *
     * @param id - The unique identifier of the user.
     * @param body - The profile fields to update.
     * @returns The updated user entity.
     */
    @UseGuards(AuthenticatorGuard)
    @HttpCode(200)
    @Put('users/me')
    async update(
        @Req() req: Request,
        @Body() body: UpdateUserParametersDto
    ): Promise<UserResponseDto> {
        const user = (req as any).user;

        const userUpdated = await this.userService.update(user.id, body);

        return UserResponseDto.from(userUpdated);
    }

    /**
     * Updates the status of a user account.
     *
     * @param id - The unique identifier of the user.
     * @param body - The new status payload.
     * @returns The updated user entity.
     */
    @UseGuards(AuthenticatorGuard)
    @HttpCode(200)
    @Patch('users/status')
    async updateStatus(
        @Req() req: Request,
        @Body() body: UpdateUserStatusDto
    ): Promise<UserResponseDto> {
        const user = (req as any).user;

        const userUpdated = await this.userService.updateStatus(user.id, body.status);

        return UserResponseDto.from(userUpdated);
    }
}
