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
      automationEligible: true,
      class: 'bug',
      confidence: 0.8,
      rationale: 'Crash',
    })
  })

  it('rejects missing JSON objects', () => {
    expect(() => extractJsonObject('no json here')).toThrow(/JSON object/)
  })
})
