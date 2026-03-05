// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Query parameters for retrieving skills.
 */
export type SkillsQuery = {
  /**
   * Optional name filter.
   * If provided, the repository should search by partial match (contains).
   */
  q?: string;

  /**
   * Page number (1-based).
   * Example: 1 = first page, 2 = second page.
   */
  page?: number;

  /**
   * Number of items per page.
   * Usually normalized later (e.g., default 20, max 100).
   */
  size?: number;
};
