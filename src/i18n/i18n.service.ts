// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { I18nService as i18n } from 'nestjs-i18n';

/**
 * Centralized internationalization (i18n) service.
 *
 * This service provides a structured and type-safe access layer
 * to localized messages used throughout the application.
 *
 * It acts as an abstraction over the underlying i18n library,
 * ensuring that: - cross-domain localized messages are grouped together,
 * - translation keys are centralized and discoverable,
 * - message usage is consistent across modules,
 * - refactors are safer and less error-prone,
 * - domain-specific messages are clearly grouped.
 *
 * This service is intended to be injected into application
 * services, exception mappers, and filters that require
 * localized, user-facing messages.
 */
@Injectable()
export class I18nService {
  // MARK: - Helpers

  /**
   * Authentication-related localized messages.
   *
   * These messages are used for authentication and
   * authorization flows such as sign-in, sign-up,
   * account verification, and access restrictions.
   */
  readonly authentication = {
    /**
     * Message displayed when a user attempts to authenticate
     * without having confirmed their account.
     */
    accountNotConfirmed: () =>
      this.i18n.t('authentication.account_not_confirmed'),

    /**
     * Message displayed when a user needs to confirm their account
     * before completing the sign-up or authentication process.
     */
    confirmSignUpFailed: () =>
      this.i18n.t('authentication.confirm_sign_up_failed'),

    /**
     * Message displayed when an inactive or disabled
     * user attempts to authenticate.
     */
    inactiveUser: () => this.i18n.t('authentication.inactive_user'),

    /**
     * Message displayed when authentication fails due
     * to invalid credentials.
     */
    invalidCredentials: () => this.i18n.t('authentication.invalid_credentials'),

    /**
     * Message displayed when a new password is required
     * to complete the authentication flow.
     */
    newPasswordRequired: () =>
      this.i18n.t('authentication.new_password_required'),

    /**
     * Message displayed when a phone number is already
     * registered to another user account.
     */
    phoneNumberAlreadyRegistered: () => {
      return this.i18n.t('authentication.phone_number_already_registered');
    },

    /**
     * Message displayed when user registration fails due to
     * conflicting information (e.g., email or phone already registered).
     *
     * This is a generic message to prevent enumeration attacks
     * while guiding users to verify their information.
     */
    signupFailed: () => this.i18n.t('authentication.signup_failed'),

    /**
     * Message displayed when a user attempts to register
     * with an identifier that already exists.
     */
    userAlreadyExists: () => this.i18n.t('authentication.user_already_exists'),

    /**
     * Message displayed when a user cannot be found in the system
     * during authentication or account lookup.
     */
    userNotFound: () => this.i18n.t('authentication.user_not_found'),

    /**
     * Message prompting the user to verify their account
     * using a confirmation code or link.
     */
    verifyYourAccount: () => this.i18n.t('authentication.verify_your_account'),
  };

  /**
   * Agents, cross-domain localized messages.
   *
   * These messages are specific to the agents domain.
   */
  readonly agents = {
    /**
     * Message displayed when a agent is required.
     */
    requiredName: () => this.i18n.t('agents.agent_required_name'),

    /**
     * Message displayed when an agent is not found.
     */
    agentNotFound: () => this.i18n.t('agents.agent_not_found'),

    /**
     * Message displayed when an intent (slug) is not found.
     */
    intentNotFound: () => this.i18n.t('agents.intent_not_found'),

    /**
     * Message displayed when an agent intent is not found.
     */
    agentIntentNotFound: () => this.i18n.t('agents.agent_intent_not_found'),

    /**
     * Message displayed when a agent ID is required.
     */
    agentRequiredId: () => this.i18n.t('agents.agent_required_id'),
  };

  /**
   * Common, cross-domain localized messages.
   *
   * These messages are generic and may be reused across
   * multiple modules and error scenarios.
   */
  readonly common = {
    /**
     * Message displayed when a record already exists with the same unique identifier.
     */
    recordAlreadyExists: () => this.i18n.t('common.record_already_exists'),

    /**
     * Message displayed when the requested record was not found.
     */
    recordNotFound: () => this.i18n.t('common.record_not_found'),

    /**
     * Message displayed when a request cannot be processed
     * due to invalid input or business rule violations.
     */
    requestCouldNotBeProcessed: () =>
      this.i18n.t('common.request_could_not_be_processed'),

    /**
     * Message displayed when the service is temporarily
     * unavailable due to internal errors.
     */
    serviceUnavailable: () => this.i18n.t('common.service_unavailable'),

    /**
     * Message displayed when the rate limit is exceeded.
     */
    rateLimitExceeded: () => this.i18n.t('common.rate_limit_exceeded'),

    /**
     * Message displayed when the JSON response format is not valid.
     */
    jsonResponseFormatError: () =>
      this.i18n.t('common.json_response_format_error'),

    /**
     * Message displayed when the insufficient quota.
     */
    insufficientQuota: () => this.i18n.t('common.insufficient_quota'),
  };

  /**
   * Jobs, cross-domain localized messages.
   *
   * These messages are specific to the jobs domain.
   */
  readonly jobs = {
    /**
     * Message displayed when a job is not found.
     */
    jobNotFound: () => this.i18n.t('jobs.job_not_found'),

    /**
     * Message displayed when a job ID is not found.
     */
    jobIdNotFound: () => this.i18n.t('jobs.job_id_not_found'),

    /**
     * Message displayed when a job status update fails.
     */
    jobStatusUpdateFailed: () => this.i18n.t('jobs.job_status_update_failed'),
  };

  /**
   * Skills, cross-domain localized messages.
   */
  readonly skills = {
    /**
     * Message displayed when a request cannot be processed
     * due to invalid input or business rule violations.
     */
    skillAlreadyRegistered: () =>
      this.i18n.t('skills.skill_already_registered'),

    /**
     * Message displayed when the service is temporarily
     * unavailable due to internal errors.
     */
    skillNotRegistered: () => this.i18n.t('skills.skill_not_registered'),

    /**
     * Message displayed when a skill is not found.
     */
    skillNotFound: () => this.i18n.t('skills.skill_not_found'),
  };

  /**
   * Storage, cross-domain localized messages.
   *
   * These messages are specific to the storage domain.
   */
  readonly storage = {
    /**
     * Message displayed when a storage delete fails.
     */
    storageDeleteFailed: () => this.i18n.t('storage.storage_delete_failed'),

    /**
     * Message displayed when a storage read fails.
     */
    storageReadFailed: () => this.i18n.t('storage.storage_read_failed'),

    /**
     * Message displayed when a storage write fails.
     */
    storageWriteFailed: () => this.i18n.t('storage.storage_write_failed'),

    /**
     * Message displayed when a storage initialization fails.
     */
    storageInitializationFailed: () =>
      this.i18n.t('storage.storage_initialization_failed'),
  };

  /**
   * Organization-related localized messages.
   *
   * These messages are used for organization creation, management,
   * and membership flows.
   */
  readonly organizations = {
    /**
     * Message displayed when a requested organization role
     * cannot be found.
     */
    roleNotFound: () => this.i18n.t('organizations.role_not_found'),

    /**
     * Message that includes the organization name (e.g. for confirmation
     * or display). Accepts a dynamic name via interpolation.
     *
     * @param name - The organization name to interpolate into the message.
     * @returns The localized string with the name inserted.
     */
    organizationName: (name: string) =>
      this.i18n.t('organizations.organization_name', { args: { name } }),
  };

  /**
   * User-related localized messages.
   *
   * These messages are used for user profile and account
   * lookup flows.
   */
  readonly user = {
    /**
     * Message displayed when a requested user
     * cannot be found.
     */
    userNotFound: () => this.i18n.t('user.user_not_found'),

    /**
     * Message displayed when attempting to update a user status
     * to the same value.
     */
    userStatusUnchanged: () => this.i18n.t('user.user_status_unchanged'),

    /**
     * Message displayed when a phone number is already registered.
     */
    phoneRegistered: () => this.i18n.t('user.phone_registered'),

    /**
     * Message displayed when a phone number is not registered.
     */
    phoneNotRegistered: () => this.i18n.t('user.phone_not_registered'),
  };

  // MARK: - Constructor

  /**
   * Creates a new {@link I18nService}.
   *
   * @param i18n - The underlying i18n provider used to
   * resolve translation keys into localized strings.
   */
  constructor(private readonly i18n: i18n) {}
}
