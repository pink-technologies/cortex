// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../src/workflow/datatypes'
import { jiraTriageFlow } from '../../src/workflow/definitions/flows/jira-triage.flow'
import { JiraTriageFlowDefinitionKey } from '../../src/workflow/definitions/keys'
import { WorkflowDefinitionRegistry } from '../../src/workflow/definitions/registry'

describe('jira.triage.flow definition', () => {
  it('registers a single jira.triage job step', () => {
    const registry = new WorkflowDefinitionRegistry()
    registry.register(jiraTriageFlow)

    const definition = registry.resolve(JiraTriageFlowDefinitionKey)

    expect(definition.key).toBe(JiraTriageFlowDefinitionKey)
    expect(definition.steps).toEqual([
      {
        key: 'main',
        kind: WorkflowStepKind.JOB,
        jobKind: JiraTriageJobKind,
        position: 0,
      },
    ])
  })

  it('rejects duplicate registration', () => {
    const registry = new WorkflowDefinitionRegistry()
    registry.register(jiraTriageFlow)

    expect(() => registry.register(jiraTriageFlow)).toThrow()
  })
})
