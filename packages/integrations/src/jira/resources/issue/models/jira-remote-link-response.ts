// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Remote-link entry as returned by `GET /rest/api/3/issue/{issueKey}/remotelink`.
 */
export interface JiraRemoteLinkResponse {
  /**
   * Linked object metadata when Jira includes an `object` payload.
   */
  readonly object?: JiraRemoteLinkResponseObject
}

/**
 * Nested `object` payload on a Jira remote-link response entry.
 */
export interface JiraRemoteLinkResponseObject {
  /**
   * Optional title of the remote resource.
   */
  readonly title?: string

  /**
   * Absolute URL of the remote resource when present.
   */
  readonly url?: string
}
