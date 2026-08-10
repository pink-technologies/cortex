// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  flattenGuidelineDocuments,
  parseProjectReviewRuleCatalog,
} from '../../../../src/handlers/repository-review/rules/repository-review-rule-catalog'
import { selectApplicableRepositoryReviewRules } from '../../../../src/handlers/repository-review/rules/select-applicable-repository-review-rules'
import { validateAndScoreRepositoryReviewRules } from '../../../../src/handlers/repository-review/rules/validate-and-score-repository-review-rules'
import { formatRepositoryReviewApplicableRules } from '../../../../src/handlers/repository-review/rules/format-repository-review-applicable-rules'
import {
  defaultRepositoryReviewScoringConfig,
  loadRepositoryReviewScoringConfig,
  RepositoryReviewScoringConfigSchema,
} from '../../../../src/handlers/repository-review/rules/repository-review-scoring-config'
import { repositoryReviewResult } from '../fixtures/repository-review-result.fixture'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('parseProjectReviewRuleCatalog', () => {
  it('parses TruVideo-style rule headings and deduplicates by id', () => {
    const catalog = parseProjectReviewRuleCatalog([
      {
        contents: [
          '### TV-TEST-050 — Map UITest ids to production a11y `[HIGH]`',
          '',
          'Body.',
          '',
          '### TV-TEST-051 — Match element type `[HIGH]`',
          '',
          '### TV-TEST-050 — Duplicate ignored `[LOW]`',
        ].join('\n'),
        path: '.agents/skills/demo/references/testing-strategy-full-spec.md',
      },
      {
        contents: '## CX-API-010 — Keep public surface minimal `[MEDIUM]`\n',
        path: 'AGENTS.md',
      },
    ])

    expect(catalog).toEqual([
      {
        id: 'TV-TEST-050',
        severity: 'high',
        sourcePath: '.agents/skills/demo/references/testing-strategy-full-spec.md',
        title: 'Map UITest ids to production a11y',
      },
      {
        id: 'TV-TEST-051',
        severity: 'high',
        sourcePath: '.agents/skills/demo/references/testing-strategy-full-spec.md',
        title: 'Match element type',
      },
      {
        id: 'CX-API-010',
        severity: 'medium',
        sourcePath: 'AGENTS.md',
        title: 'Keep public surface minimal',
      },
    ])
  })

  it('returns an empty catalog when no parseable headings exist', () => {
    expect(
      parseProjectReviewRuleCatalog([
        {
          contents: 'Prefer early returns. No rule ids here.',
          path: 'AGENTS.md',
        },
      ]),
    ).toEqual([])
  })

  it('flattens guideline collections for catalog parsing', () => {
    const documents = flattenGuidelineDocuments({
      agentsDocuments: [{ contents: 'a', path: 'AGENTS.md' }],
      agentSkillDocuments: [{ contents: 'b', path: '.agents/skills/x/SKILL.md' }],
      cursorRuleDocuments: [],
      referencedDocuments: [{ contents: 'c', path: 'docs/style.md' }],
    })

    expect(documents.map((document) => document.path)).toEqual([
      'AGENTS.md',
      '.agents/skills/x/SKILL.md',
      'docs/style.md',
    ])
  })
})

describe('selectApplicableRepositoryReviewRules', () => {
  const catalog = parseProjectReviewRuleCatalog([
    {
      contents: [
        '### TV-TEST-050 — Map UITest ids `[HIGH]`',
        '### TV-TEST-051 — Match element type `[HIGH]`',
        '### CX-API-010 — Public surface `[MEDIUM]`',
      ].join('\n'),
      path: '.agents/skills/truvideo-sdk-style/references/testing-strategy-full-spec.md',
    },
  ])

  it('selects testing-strategy rules when UITest paths change', () => {
    const applicable = selectApplicableRepositoryReviewRules(catalog, [
      'UITests/PermissionsScreen.swift',
      'Sources/Feature/View.swift',
    ])

    expect(applicable.map((rule) => rule.id)).toEqual(
      expect.arrayContaining(['TV-TEST-050', 'TV-TEST-051']),
    )
  })

  it('returns only elevated rules when paths are unavailable', () => {
    const applicable = selectApplicableRepositoryReviewRules(catalog, [])

    expect(applicable.every((rule) => rule.severity === 'high' || rule.severity === 'blocker')).toBe(
      true,
    )
    expect(applicable.map((rule) => rule.id)).not.toContain('CX-API-010')
  })

  it('returns empty when the catalog is empty', () => {
    expect(selectApplicableRepositoryReviewRules([], ['UITests/A.swift'])).toEqual([])
  })
  it('respects maxApplicableRules from scoring config', () => {
    const applicable = selectApplicableRepositoryReviewRules(
      catalog,
      ['UITests/PermissionsScreen.swift'],
      {
        elevatedFailPenalty: 0.05,
        elevatedSeverities: ['blocker', 'high'],
        maxApplicableRules: 1,
        schemaVersion: 1,
        weights: { ...defaultRepositoryReviewScoringConfig.weights },
      },
    )

    expect(applicable).toHaveLength(1)
  })
})

describe('loadRepositoryReviewScoringConfig', () => {
  let workspacePath: string

  beforeEach(async () => {
    workspacePath = await mkdtemp(join(tmpdir(), 'cortex-review-scoring-'))
  })

  afterEach(async () => {
    await rm(workspacePath, { force: true, recursive: true })
  })

  it('returns defaults when the project file is missing', async () => {
    const config = await loadRepositoryReviewScoringConfig(workspacePath)

    expect(config.elevatedFailPenalty).toBe(defaultRepositoryReviewScoringConfig.elevatedFailPenalty)
    expect(config.maxApplicableRules).toBe(defaultRepositoryReviewScoringConfig.maxApplicableRules)
    expect(config.weights).toEqual(defaultRepositoryReviewScoringConfig.weights)
  })

  it('loads and merges a project scoring file', async () => {
    await mkdir(join(workspacePath, '.cortex'), { recursive: true })
    await writeFile(
      join(workspacePath, '.cortex', 'review-scoring.toml'),
      [
        'schemaVersion = 1',
        'elevatedFailPenalty = 0.1',
        'maxApplicableRules = 12',
        'elevatedSeverities = ["blocker"]',
        '',
        '[weights]',
        'blocker = 10',
        'high = 5',
        'medium = 2',
        'low = 1',
        'unknown = 2',
        '',
      ].join('\n'),
      'utf8',
    )

    const config = await loadRepositoryReviewScoringConfig(workspacePath)

    expect(config).toEqual({
      elevatedFailPenalty: 0.1,
      elevatedSeverities: ['blocker'],
      maxApplicableRules: 12,
      schemaVersion: 1,
      weights: {
        blocker: 10,
        high: 5,
        low: 1,
        medium: 2,
        unknown: 2,
      },
    })
  })

  it('fails closed when the project scoring file is invalid', async () => {
    await mkdir(join(workspacePath, '.cortex'), { recursive: true })
    await writeFile(join(workspacePath, '.cortex', 'review-scoring.toml'), 'elevatedFailPenalty = "nope"\n', 'utf8')

    await expect(loadRepositoryReviewScoringConfig(workspacePath)).rejects.toThrow()
  })

  it('fills omitted fields from schema defaults', () => {
    expect(RepositoryReviewScoringConfigSchema.parse({ schemaVersion: 1 })).toEqual({
      elevatedFailPenalty: defaultRepositoryReviewScoringConfig.elevatedFailPenalty,
      elevatedSeverities: [...defaultRepositoryReviewScoringConfig.elevatedSeverities],
      maxApplicableRules: defaultRepositoryReviewScoringConfig.maxApplicableRules,
      schemaVersion: 1,
      weights: { ...defaultRepositoryReviewScoringConfig.weights },
    })
  })
})

describe('validateAndScoreRepositoryReviewRules', () => {
  const applicable = [
    {
      id: 'TV-TEST-050',
      severity: 'high' as const,
      sourcePath: 'refs.md',
      title: 'Map ids',
    },
    {
      id: 'TV-TEST-051',
      severity: 'high' as const,
      sourcePath: 'refs.md',
      title: 'Element type',
    },
    {
      id: 'TV-TEST-055',
      severity: 'medium' as const,
      sourcePath: 'refs.md',
      title: 'UITest NOT_RUN',
    },
  ]

  it('skips scoring when no applicable rules exist', () => {
    const result = validateAndScoreRepositoryReviewRules(
      repositoryReviewResult({
        ruleOutcomes: [{ findingIds: [], ruleId: 'X', status: 'pass' }],
        score: { summary: 'ignored', value: 1 },
      }),
      [],
    )

    expect(result.ruleOutcomes).toEqual([])
    expect(result.score).toBeUndefined()
  })

  it('upgrades pass to fail when findings cite the rule and fills missing outcomes', () => {
    const result = validateAndScoreRepositoryReviewRules(
      repositoryReviewResult({
        decision: 'request_changes',
        findings: [
          {
            category: 'test_coverage',
            confidence: 'high',
            disposition: 'required_before_merge',
            evidence: ['UITests/A.swift'],
            id: 'a11y-type',
            impact: 'Wrong query.',
            problem: 'Button vs staticText.',
            recommendation: 'Fix query.',
            ruleIds: ['TV-TEST-051'],
            severity: 'high',
            title: 'Wrong type',
            verification: [],
          },
        ],
        ruleOutcomes: [
          { findingIds: [], reason: 'Looks fine', ruleId: 'TV-TEST-051', status: 'pass' },
          { findingIds: [], reason: 'Reviewed screens', ruleId: 'TV-TEST-050', status: 'pass' },
        ],
        summary: 'Needs fixes.',
      }),
      applicable,
    )

    expect(result.ruleOutcomes).toEqual([
      {
        findingIds: [],
        reason: 'Reviewed screens',
        ruleId: 'TV-TEST-050',
        status: 'pass',
      },
      {
        findingIds: ['a11y-type'],
        reason: 'Looks fine',
        ruleId: 'TV-TEST-051',
        status: 'fail',
      },
      {
        findingIds: [],
        reason: 'Host checklist id missing from engine ruleOutcomes.',
        ruleId: 'TV-TEST-055',
        status: 'not_reviewed',
      },
    ])
    expect(result.score?.value).toBeLessThan(1)
    expect(result.score?.summary).toContain('1 pass')
    expect(result.score?.summary).toContain('1 fail')
    expect(result.score?.summary).toContain('1 not_reviewed')
  })

  it('downgrades dishonest fail outcomes without citing findings', () => {
    const result = validateAndScoreRepositoryReviewRules(
      repositoryReviewResult({
        findings: [
          {
            category: 'test_coverage',
            confidence: 'high',
            disposition: 'follow_up',
            evidence: [],
            id: 'unrelated',
            impact: 'n/a',
            problem: 'Unrelated finding.',
            recommendation: 'n/a',
            ruleIds: [],
            severity: 'low',
            title: 'Unrelated',
            verification: [],
          },
        ],
        ruleOutcomes: [
          { findingIds: ['unrelated'], ruleId: 'TV-TEST-050', status: 'fail' },
          { findingIds: [], reason: 'ok', ruleId: 'TV-TEST-051', status: 'pass' },
          { findingIds: [], reason: 'NOT_RUN', ruleId: 'TV-TEST-055', status: 'not_reviewed' },
        ],
      }),
      applicable,
    )

    expect(result.ruleOutcomes.find((outcome) => outcome.ruleId === 'TV-TEST-050')).toEqual({
      findingIds: [],
      reason: 'Engine marked fail without findings that cite this rule id.',
      ruleId: 'TV-TEST-050',
      status: 'not_reviewed',
    })
  })

  it('applies project scoring weights and elevated-fail penalty', () => {
    const result = validateAndScoreRepositoryReviewRules(
      repositoryReviewResult({
        findings: [
          {
            category: 'test_coverage',
            confidence: 'high',
            disposition: 'required_before_merge',
            evidence: [],
            id: 'f1',
            impact: 'x',
            problem: 'x',
            recommendation: 'x',
            ruleIds: ['TV-TEST-051'],
            severity: 'high',
            title: 'Fail',
            verification: [],
          },
        ],
        ruleOutcomes: [
          { findingIds: [], reason: 'ok', ruleId: 'TV-TEST-050', status: 'pass' },
          { findingIds: ['f1'], ruleId: 'TV-TEST-051', status: 'fail' },
          { findingIds: [], reason: 'skip', ruleId: 'TV-TEST-055', status: 'not_reviewed' },
        ],
      }),
      applicable,
      {
        elevatedFailPenalty: 0.1,
        elevatedSeverities: ['high'],
        maxApplicableRules: 40,
        schemaVersion: 1,
        weights: {
          blocker: 4,
          high: 10,
          low: 1,
          medium: 1,
          unknown: 1,
        },
      },
    )

    // passWeight=10, totalWeight=10+10+1=21 → raw≈0.4762, elevated fail penalty 0.1 → ≈0.3762
    expect(result.score?.value).toBeCloseTo(10 / 21 - 0.1, 4)
    expect(result.score?.summary).toContain('elevated-fail penalty')
  })
})

describe('formatRepositoryReviewApplicableRules', () => {
  it('returns undefined for an empty list', () => {
    expect(formatRepositoryReviewApplicableRules([])).toBeUndefined()
  })

  it('formats the host checklist prompt section', () => {
    const formatted = formatRepositoryReviewApplicableRules([
      {
        id: 'TV-TEST-051',
        severity: 'high',
        sourcePath: 'refs.md',
        title: 'Match element type',
      },
    ])

    expect(formatted).toContain('## Applicable project rules (host checklist)')
    expect(formatted).toContain('`TV-TEST-051` [high] — Match element type')
    expect(formatted).toContain('Emit exactly one `ruleOutcomes` entry')
  })
})
