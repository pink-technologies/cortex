// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { OrganizationRole } from "@/infraestructure/database";
import { RoleType } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { OrganizationRolesRepository } from "../../repositories";
import { RoleNotFound } from "../error/organization.error";

/**
 * Service responsible for managing organization roles.
 *
 * This service provides operations to find organization roles by type and retrieve all organization roles.
 */
@Injectable()
export class OrganizationRolesService {
    // MARK: - Constructor

    /**
     * Creates a new {@link OrganizationRoles}.
     * 
     * @param organizationRolesRepository - The repository responsible for querying organization role entities.
     */
    constructor(private readonly organizationRolesRepository: OrganizationRolesRepository) { }

    // MARK: - Instance methods

    /**
     * Finds an organization role by its unique identifier.
     *
     * @param id - The unique identifier of the role.
     * @param userId - The unique identifier of the user.
     * @returns The matching role or null if not found.
     *
     * @throws RoleNotFound when the role cannot be found.
     */
    async findById(id: string, userId: string): Promise<OrganizationRole> {
        const role = await this.organizationRolesRepository.findById(id, userId);

        if (!role) throw new RoleNotFound();

        return role;
    }

    /**
     * Finds an organization role by its role type within an organization.
     *
     * @param organizationId - The organization that owns the role.
     * @param roleType - The role type to look up.
     * @returns The matching role or null if not found.
     */
    async findByRoleType(roleType: RoleType): Promise<OrganizationRole> {
        if (!Object.values(RoleType).includes(roleType)) {
            throw new RoleNotFound();
        }

        const role = await this.organizationRolesRepository.findByRoleType(roleType);

        if (!role) throw new RoleNotFound();

        return role;
    }

    /**
     * Retrieves all organization roles.
     *
     * @returns A list of all organization roles.
     */
    async retrieve(userId: string): Promise<OrganizationRole[]> {
        return await this.organizationRolesRepository.retrieve(userId);
    }
}
