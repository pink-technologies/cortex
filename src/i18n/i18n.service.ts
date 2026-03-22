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
   * Chats, cross-domain localized messages.
   *
   * These messages are specific to the chats domain.
   */
  readonly chats = {
    /**
     * Message displayed when a chat is not found.
     */
    chatNotFound: () => this.i18n.t('chats.chat_not_found'),
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
    requestCouldNotBeProcessed: () => this.i18n.t('common.request_could_not_be_processed'),

    /**
     * Message displayed when the service is temporarily
     * unavailable due to internal errors.
     */
    serviceUnavailable: () => this.i18n.t('common.service_unavailable'),
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
    skillAlreadyRegistered: () => this.i18n.t('skills.skill_already_registered'),

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
    storageInitializationFailed: () => this.i18n.t('storage.storage_initialization_failed'),
  };

  // MARK: - Constructor

  /**
   * Creates a new {@link I18nService}.
   *
   * @param i18n - The underlying i18n provider used to
   * resolve translation keys into localized strings.
   */
  constructor(private readonly i18n: i18n) { }
}
