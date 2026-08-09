// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseFilters } from "@nestjs/common"
import { NodeExceptionFilter } from "./filter/exception.filter"
import { NodesService } from "./nodes.service"
import { ZodValidationPipe } from "@/http/pipes/zod-validation.pipe"
import { 
    type RegisterNodeRequest, 
    RegisterNodeRequestSchema, 
    RegisterNodeResponse, 
    RegisterNodeResponseSchema 
} from "@cortex/protocol"

/**
 * HTTP boundary for execution-node registration and heartbeat operations.
 *
 * Registration payloads are validated against the shared Cortex protocol
 * schemas before reaching {@link NodesService}. Node-domain failures are
 * translated into HTTP responses by {@link NodeExceptionFilter}.
 */
@Controller('nodes')
@UseFilters(NodeExceptionFilter)
export class NodesController {
  // MARK: - Constructor

  /**
   * Creates the execution-node controller.
   *
   * @param nodesService - Application service that enforces node lifecycle
   *   rules and coordinates persistence.
   */
  constructor(private readonly nodesService: NodesService) {}

  // MARK: - Instance methods

  /**
   * Records activity for a registered node.
   *
   * The `id` route parameter must be a valid UUID. A successful heartbeat
   * returns HTTP 204 with no response body.
   *
   * @param id - Stable server-assigned node identifier.
   */
  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  async heartbeat(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.nodesService.heartbeat(id)
  }

  /**
   * Registers a node or refreshes an existing installation registration.
   *
   * The request is validated with {@link RegisterNodeRequestSchema}. The
   * response contains the server-assigned node identifier and the heartbeat
   * interval the node should use.
   *
   * @param registerNodeRequest - Validated node identity, host metadata,
   *   capabilities, and supported execution kinds.
   * @returns The protocol-compliant registration response.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(RegisterNodeRequestSchema))
    registerNodeRequest: RegisterNodeRequest,
  ): Promise<RegisterNodeResponse> {
    const executionNode = await this.nodesService.register(registerNodeRequest)

    return RegisterNodeResponseSchema.parse({
      heartbeatIntervalSeconds: 30,
      nodeId: executionNode.id,
    })
  }
}