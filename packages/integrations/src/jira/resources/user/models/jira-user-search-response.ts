// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Wire shape for one entry from `GET /rest/api/3/user/search`.
 */
export type JiraUserSearchResponse = {
  readonly accountId?: string
  readonly displayName?: string
  readonly emailAddress?: string
}
