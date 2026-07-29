// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';

/**
 * Validates one selectable value presented by a configuration field.
 *
 * `value` is the stable machine-readable value persisted or submitted by a
 * client, while `label` is the human-readable text shown in the interface.
 */
export const configOptionSchema = z.object({
  /** Stable value used by application logic. */
  value: z.string(),

  /** Human-readable display text for the option. */
  label: z.string(),
});

/**
 * Validates the metadata and input contract for a configurable setting.
 *
 * The schema describes how a setting is identified, presented, validated, and
 * optionally populated. Select-based fields may provide inline
 * {@link configOptionSchema options} or identify a dynamic `source`.
 */
export const configurationSchema = z.object({
  /** Stable identifier used to read and persist the setting. */
  key: z.string(),

  /** Human-readable field label. */
  label: z.string(),

  /** Explanatory text describing the setting's purpose. */
  description: z.string(),

  /** Input control expected from configuration clients. */
  type: z.enum(['multiselect', 'select', 'text']),

  /** Whether a value must be supplied. */
  required: z.boolean(),

  /** Optional identifier for a dynamically resolved option source. */
  source: z.string().optional(),

  /** Optional initial value used when no explicit value is supplied. */
  default: z.string().optional(),

  /** Optional inline choices for select or multiselect fields. */
  options: z.array(configOptionSchema).optional(),
});

/**
 * A validated selectable configuration value.
 *
 * Inferred from {@link configOptionSchema} to keep the compile-time type
 * aligned with runtime validation.
 */
export type ConfigOption = z.infer<typeof configOptionSchema>;

/**
 * A validated configuration-field definition.
 *
 * Inferred from {@link configurationSchema} to keep the compile-time type
 * aligned with runtime validation.
 */
export type Config = z.infer<typeof configurationSchema>;
