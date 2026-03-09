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
 * ensuring that:
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
    agentRequiredName: () => this.i18n.t('agents.agent_required_name'),

    /**
     * Message displayed when a agent is not found. 
     */
    agentNotFound: () => this.i18n.t('agents.agent_not_found'),

    /**
     * Message displayed when a agent ID is required.
     */
    agentRequiredId: () => this.i18n.t('agents.agent_required_id'),
  };

  /**
   * Agents skills, cross-domain localized messages.
   *
   * These messages are specific to the agents skills domain.
   */
  readonly agentsSkills = {
    /**
     * Message displayed when a skill is added to an agent successfully.
     */
    skillAddedToAgentSuccessfully: () => this.i18n.t('agents-skills.skill_added_to_agent_successfully'),

    /**
     * Message displayed when a skill is removed from an agent successfully.
  
    /**
     * Message displayed when a skill is removed from an agent successfully.
     */
    skillRemovedFromAgentSuccessfully: () => this.i18n.t('agents-skills.skill_removed_from_agent_successfully'),
  };

  /**
   * Common, cross-domain localized messages.
   *
   * These messages are generic and may be reused across
   * multiple modules and error scenarios.
   */
  readonly common = {
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
 * Common, cross-domain localized messages.
 *
 * These messages are generic and may be reused across
 * multiple modules and error scenarios.
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
     * Message displayed when a skill ID is required.
     */
    skillRequiredId: () => this.i18n.t('skills.skill_required_id'),

    /**
     * Message displayed when a skill name is required.
     */
    skillRequiredName: () => this.i18n.t('skills.skill_required_name'),

    /**
     * Message displayed when a skill is not found.
     */
    skillNotFound: () => this.i18n.t('skills.skill_not_found'),
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
