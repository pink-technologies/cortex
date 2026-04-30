// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service';
import { RoleType } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { RoleNotFound } from "../error/organization.error";
import { toOrganizationHttpException } from "../../mapper/organization-error.mapper";
import {
    Database,
    type DatabaseTransaction,
    Organization,
} from "@/infraestructure/database";
import {
    OrganizationMembershipsRepository,
    OrganizationRolesRepository,
    OrganizationsRepository,
} from "../../repositories";

/**
 * Parameters required to create an organization.
 *
 * This type defines the shape of data passed from the service to the repository
 * when creating a organization. The service typically receives a validated
 * {@link CreateOrganizationParameters} from the controller and maps it to this
 * type (e.g. adding ownerId from the authenticated user context) before calling
 * the repository.
 *
 * All values are expected to be normalized before being passed to the repository.
 */
export type CreateOrganizationParameters = {
    /**
     * The name of the organization.
     *
     * This value represents the display name of the organization and is
     * typically shown to users in the application interface.
     */
    name: string;

    /**
     * The user ID of the organization owner.
     *
     * This value is used to associate the organization with the user who created it.
     */
    ownerId: string;
};


@Injectable()
export class OrganizationsService {
    // MARK: - Constructor

    /**
     * Creates a new {@link OrganizationsService}.
     *
     * @param database - The database client used to run transactions. Injected at
     * runtime to support inversion of control and enable testability.
     * @param i18nService - The i18n service used to resolve localized messages
     * for user-facing responses (e.g. organization names, error messages).
     * @param organizationMembershipsRepository - The repository responsible for
     * persisting and querying organization membership entities.
     * @param organizationRolesRepository - The repository responsible for
     * persisting and querying organization role entities.
     * @param organizationsRepository - The repository responsible for persisting
     * and querying organization entities. Injected at runtime to keep the service
     * decoupled from persistence details.
     */
    constructor(
        private readonly database: Database,
        private readonly i18nService: I18nService,
        private readonly organizationMembershipsRepository: OrganizationMembershipsRepository,
        private readonly organizationRolesRepository: OrganizationRolesRepository,
        private readonly organizationsRepository: OrganizationsRepository,
    ) { }

    // MARK: - Instance methods

    /**
     * Creates a new organization within a database transaction.
     *
     * The service receives parameters (e.g. from a DTO mapped to
     * {@link CreateOrganizationParameters}) and delegates to the repository.
     *
     * @param parameters - The parameters required to create the organization.
     * @param options - Optional existing transaction to participate in.
     * @returns The newly created organization entity.
     */
    async create(
        parameters: CreateOrganizationParameters,
        transaction?: DatabaseTransaction,
    ): Promise<Organization> {
        try {
            const executeTransaction = async (transaction: DatabaseTransaction): Promise<Organization> => {
                const organization = await this.organizationsRepository.create(
                    this.i18nService.organizations.organizationName(parameters.name),
                    { transaction }
                );
    
                const role = await this.organizationRolesRepository.findByRoleType(
                    RoleType.OWNER,
                    { transaction },
                );
    
                if (!role) throw new RoleNotFound();
    
                await this.organizationMembershipsRepository.create({
                    userId: parameters.ownerId,
                    roleId: role.id,
                    organizationId: organization.id,
                }, {
                    transaction,    
                });
    
                return organization;
            }
    
            if (transaction) {
                return executeTransaction(transaction);
            }
    
            return this.database.withTransaction(executeTransaction);
        } catch (error){
            throw toOrganizationHttpException(error, this.i18nService);
        }
    }
}
