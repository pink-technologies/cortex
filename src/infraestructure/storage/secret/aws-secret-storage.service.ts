// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Storage } from '../storage';
import {
  CreateSecretCommand,
  DeleteSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'
import {
  ReadStorageError,
  StorageWriteError,
  StorageDeletionError,
} from '../error/storage-error';

/**
 * AWS Secrets Manager Storage Service
 *
 * Implements the {@link Storage} using AWS Secrets Manager as backend.
 *
 * Responsibilities:
 * - Stores values as JSON strings.
 * - Retrieves and parses values into typed objects.
 * - Acts as infrastructure layer between domain and AWS SDK.
 */
@Injectable()
export class AwsSecretStorageService implements Storage {
  // Mark: - Private properties

  private readonly client: SecretsManagerClient;

  // Mark: - Constructor

  /**
   * Creates a new instance of AwsSecretStorageService.
   *
   * @param client - Configured {@link SecretsManagerClient} instance.
   */
  constructor(client: SecretsManagerClient) {
    this.client = client;
  }

  // Mark: - Storage

  /**
   * Writes a value for the given key.
   *
   * @param value - Value to store.
   * @param key - Key to store the value under.
   */
  async write<T>(value: T, key: string): Promise<void> {
    try {
      const command = new CreateSecretCommand({
        Name: key,
        SecretString: JSON.stringify(value),
      })

      await this.client.send(command)
    } catch {
      throw new StorageWriteError();
    }
  }

  /**
   * Fetches the value stored for the given key.
   *
   * @param key - Key to query.
   * @returns Deserialized value, or `null` if key does not exist.
   * @throws {ReadStorageError} When the GET operation fails.
   */
  async read<T>(key: string): Promise<T | null> {
    try {
      const command = new GetSecretValueCommand({ SecretId: key })

      const response = await this.client.send(command)

      if (!response.ARN) {
        throw new ReadStorageError();
      }

      return JSON.parse(response.ARN) as T
    } catch {
      throw new ReadStorageError();
    }
  }

  /**
   * Deletes the value stored for the given key.
   *
   * @param key - Key to delete.
   * @throws {StorageDeletionError} When the DELETE operation fails.
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteSecretCommand({ SecretId: key })

      await this.client.send(command)
    } catch {
      throw new StorageDeletionError();
    }
  }
}
