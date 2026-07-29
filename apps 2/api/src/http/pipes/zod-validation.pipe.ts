// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import {
    BadRequestException,
    Injectable,
    PipeTransform,
  } from '@nestjs/common'
  
  /**
   * NestJS pipe that validates and transforms an incoming value with a Zod
   * schema.
   *
   * Successful parsing returns Zod's typed output, including any coercions,
   * defaults, or transformations defined by the schema. Validation failures
   * become HTTP 400 responses containing the structured Zod issues, keeping
   * schema-specific validation logic out of controllers.
   *
   * @typeParam Schema - Zod schema used for runtime validation and output inference.
   */
  @Injectable()
  export class ZodValidationPipe<Schema extends z.ZodType> implements PipeTransform {

    // MARK: - Constructor

    /**
     * Creates a validation pipe for a specific request contract.
     *
     * @param schema - Zod schema used to parse incoming values.
     */
    constructor(
      private readonly schema: Schema,
    ) {}

    // MARK: - PipeTransform

    /**
     * Parses an incoming NestJS argument using the configured schema.
     *
     * @param value - Raw value supplied by the request pipeline.
     * @returns The validated and potentially transformed schema output.
     * @throws {BadRequestException} When the value does not satisfy the schema.
     */
    transform(value: unknown): z.infer<Schema> {
      const result = this.schema.safeParse(value)
  
      if (!result.success) {
        throw new BadRequestException({
          message: 'Request validation failed',
          issues: result.error.issues,
        })
      }
  
      return result.data
    }
  }