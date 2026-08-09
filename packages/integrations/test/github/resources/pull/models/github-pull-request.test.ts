// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { GitHubPullRequest } from '../../../../../src/github'

describe('GitHubPullRequest', () => {
  it('maps wire fields into the domain model', () => {
    const pull = GitHubPullRequest.from({
      body: 'Details',
      head: { ref: 'feature' },
      html_url: 'https://github.com/acme/app/pull/12',
      number: 12,
      title: 'Add feature',
    })

    expect(pull).toMatchObject({
      body: 'Details',
      headRef: 'feature',
      number: 12,
      title: 'Add feature',
      url: 'https://github.com/acme/app/pull/12',
    })
  })

  it('coerces a null body to undefined', () => {
    const pull = GitHubPullRequest.from({
      body: null,
      number: 1,
      title: 'Empty',
    })

    expect(pull.body).toBeUndefined()
    expect(pull.headRef).toBeUndefined()
    expect(pull.url).toBeUndefined()
  })
})
