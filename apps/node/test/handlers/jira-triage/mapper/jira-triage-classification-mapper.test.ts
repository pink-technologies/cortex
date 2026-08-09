// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  extractJsonObject,
  mapJiraTriageClassification,
} from '../../../../src/handlers/jira-triage/mapper/jira-triage-classification-mapper'

describe('mapJiraTriageClassification', () => {
  it('parses fenced JSON classification', () => {
    expect(
      mapJiraTriageClassification(`\`\`\`json
{"class":"bug","confidence":0.8,"automationEligible":true,"rationale":"Crash"}
\`\`\``),
    ).toEqual({
      areas: [],
      automationEligible: true,
      class: 'bug',
      confidence: 0.8,
      rationale: 'Crash',
    })
  })

  it('parses classification areas', () => {
    expect(
      mapJiraTriageClassification(
        '{"class":"bug","confidence":0.9,"automationEligible":true,"areas":["App"],"rationale":"TruVideoApp race"}',
      ),
    ).toEqual({
      areas: ['App'],
      automationEligible: true,
      class: 'bug',
      confidence: 0.9,
      rationale: 'TruVideoApp race',
    })
  })

  it('rejects missing JSON objects', () => {
    expect(() => extractJsonObject('no json here')).toThrow(/JSON object/)
  })
})
