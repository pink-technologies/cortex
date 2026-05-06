// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Payload for a secret to be stored in the secret manager
 */
export type SecretPayload<T> = {
    /**
     * The name of the secret
     */
    name: string

    /**
     * The value of the secret
     */
    value: T
};

/**
 * Secret Manager interface
 */
export interface SecretManager {
    /**
     * Create a new secret in the secret manager
     * 
     * @param payload - The payload of the secret to be stored
     * @returns The reference of the secret
     */
    create<T>(payload: SecretPayload<T>): Promise<{ secretRef: string }>

    /**
     * Get a value by reference from the secret manager.
     * 
     * @param ref - The reference of the secret.
     * @returns The value of the secret.
     */
    getValueByRef<T>(ref: string): Promise<T>

    /**
     * Update a secret in the secret manager.
     * 
     * @param payload - The payload of the secret to be updated.
     */
    update<T>(payload: SecretPayload<T>): Promise<void>
}
