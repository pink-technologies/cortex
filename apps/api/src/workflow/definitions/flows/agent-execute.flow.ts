// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentExecuteJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../datatypes'
import type { WorkflowDefinition } from '../models'
import { AgentExecuteFlowDefinitionKey } from '../keys'

/**
 * One-step flow that runs an `agent.execute` execution job.
 */
export const agentExecuteFlow: WorkflowDefinition = {
  key: AgentExecuteFlowDefinitionKey,
  steps: [
    {
      key: 'main',
      kind: WorkflowStepKind.JOB,
      jobKind: AgentExecuteJobKind,
      position: 0,
    },
  ],
}
