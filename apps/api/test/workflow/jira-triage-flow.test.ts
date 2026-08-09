// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../src/workflow/datatypes'
import { jiraTriageFlow } from '../../src/workflow/definitions/flows/jira-triage.flow'
import { WorkflowDefinitionRegistry } from '../../src/workflow/definitions/registry'
describe('jira.triage.flow definition', () => {
  it('registers a single jira.triage job step', () => {
    const registry = new WorkflowDefinitionRegistry()
    registry.register(jiraTriageFlow)

    const definition = registry.resolve(jiraTriageFlow.key)

    expect(definition.key).toBe(jiraTriageFlow.key)
    expect(definition.version).toBe(1)
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
