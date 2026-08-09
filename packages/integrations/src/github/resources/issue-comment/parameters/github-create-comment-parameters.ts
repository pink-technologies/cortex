// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Inputs for {@link GitHubIssueCommentResource.create}.
 *
 * Selects the repository and the issue or pull request that receives the
 * comment, and supplies the comment body. Pull-request discussion uses the
 * same GitHub issues comments API as issues.
 */
export interface GitHubCreateCommentParameters {
  /**
   * Comment content written to the issue or pull request.
   *
   * GitHub renders Markdown; plain text is accepted as-is.
   */
  readonly body: string

  /**
   * Issue or pull-request number that receives the comment.
   *
   * For pull requests, pass the pull-request number shown in the repository
   * UI, not an internal GraphQL or database id.
   */
  readonly issueNumber: number

  /**
   * GitHub login of the user or organization that owns the repository.
   */
  readonly owner: string

  /**
   * Repository name without the owner prefix (for example `app`, not
   * `acme/app`).
   */
  readonly repository: string
}
