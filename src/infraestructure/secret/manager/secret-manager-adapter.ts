// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ErrorMapper } from './error-mapper'
import {
  CreateSecretError,
  GetSecretByRefError,
  UpdateSecretError,
} from '../error/secret-manager.error'
import {
  SecretManager,
  SecretPayload,
} from '../secret-manager'
import {
  CreateSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'

/**
 * AWS Secrets Manager Adapter
 *
 * Implements the {@link SecretManager} using AWS Secrets Manager as backend.
 *
 * Responsibilities:
 * - Stores secrets as JSON strings.
 * - Retrieves and parses secrets into typed objects.
 * - Acts as infrastructure layer between domain and AWS SDK.
 */
export class AwsSecretsManagerAdapter implements SecretManager {
  // Mark: - Private properties

  private readonly client: SecretsManagerClient;

  // Mark: - Constructor

  /**
   * Creates a new instance of AwsSecretManagerAdapter.
   *
   * @param client - Configured {@link SecretsManagerClient} instance.
   */
  constructor(client: SecretsManagerClient) {
    this.client = client;
  }

  // Mark: - SecretManager

  /**
   * Creates a new secret in {@link SecretsManager} 
   * and returns the ARN of the secret.
   *
   * @template T - Type of the value of the secret.
   *
   * @param payload - The payload of the secret to be stored.
   *
   * @returns The reference of the secret.
   */
  async create<T>(payload: SecretPayload<T>): Promise<{ secretRef: string }> {
    try {
      const command = new CreateSecretCommand({
        Name: payload.name,
        SecretString: JSON.stringify(payload.value),
      })

      const result = await this.client.send(command)

      if (!result.ARN) {
        throw new CreateSecretError(new Error(`Failed to create the secret "${payload.name}" and return the ARN`))
      }

      return { secretRef: result.ARN }
    } catch (exception) {
      throw ErrorMapper.map({
        error: exception,
        fallback: new CreateSecretError(exception),
      })
    }
  }

  /**
   * Retrieves a secret by reference from {@link SecretsManager}
   *
   * @template T - Expected type of the secret
   *
   * @param ref - The reference of the secret to retrieve
   *
   * @returns The value of the secret as type T
   */
  async getValueByRef<T>(ref: string): Promise<T> {
    try {
      const command = new GetSecretValueCommand({ SecretId: ref })

      const response = await this.client.send(command)

      if (!response.SecretString) {
        throw new GetSecretByRefError(new Error(`Secret "${ref}" not found or has no SecretString`))
      }

      return JSON.parse(response.SecretString) as T
    } catch (exception) {
      throw ErrorMapper.map({
        error: exception,
        fallback: new GetSecretByRefError(exception),
      })
    }
  }

  /**
   * Updates a secret in {@link SecretsManager}
   *
   * @template T - Type of the value of the secret
   *
   * @param payload - The payload of the secret to be updated
   */
  async update<T>(payload: SecretPayload<T>): Promise<void> {
    try {
      const command = new PutSecretValueCommand({
        SecretId: payload.name,
        SecretString: JSON.stringify(payload.value),
      })

      await this.client.send(command)
    } catch (exception) {
      throw ErrorMapper.map({
        error: exception,
        fallback: new UpdateSecretError(exception),
      })
    }
  }
}
