/**
 * Malformed-frontmatter marker: the single source of truth for "this page's
 * YAML frontmatter failed to parse, so it landed flagged instead of silently
 * mistyped."
 *
 * Why a shared module (mirrors embed-skip.ts, D4 anti-drift):
 *   `parseMarkdown` is deliberately forgiving — when gray-matter throws on bad
 *   YAML it falls back to empty frontmatter + the raw `---…---` block trapped in
 *   the body, and `type` defaults to `concept`. That silent-swallow corrupted
 *   ~310 pages (unquoted `:` in titles / leading `@` in author handles) before it
 *   was caught. This marker makes the failure LOUD and queryable without changing
 *   the forgiving contract: the page still lands (raw content preserved), but
 *   carries an explicit flag so detection (cron / dashboards / doctor) and repair
 *   can find it by JSONB key existence instead of a body LIKE-heuristic.
 *
 * Two surfaces (same split as embed-skip):
 *   - JS predicate `isMalformedFrontmatter(frontmatter)` for in-memory pages.
 *   - SQL fragment `MALFORMED_FRONTMATTER_FILTER_FRAGMENT` for queries that need
 *     to splice into a postgres-js / PGLite `sql`...`` template.
 *
 * Marker shape rationale:
 *   OBJECT (not a bare bool) so `get_page` shows WHY + WHEN at a glance. The SQL
 *   existence check (`frontmatter ? 'malformed_frontmatter'`) hits regardless of
 *   marker contents — JSONB key-existence semantics — so the shape can extend
 *   without invalidating the filter.
 */

/** The frontmatter key name. Treat as a stable contract — renaming this means
 *  rewriting every consumer of the malformed semantic. */
export const MALFORMED_FRONTMATTER_KEY = 'malformed_frontmatter';

/** SQL fragment that SELECTS pages carrying the malformed marker. Callers must
 *  reference `pages` aliased as `p`. JSONB `?` existence operator; works on both
 *  Postgres and PGLite. */
export const MALFORMED_FRONTMATTER_FILTER_FRAGMENT =
  `COALESCE(p.frontmatter, '{}'::jsonb) ? '${MALFORMED_FRONTMATTER_KEY}'`;

export interface MalformedFrontmatterMarker {
  /** Why the page was flagged. v0.41 ships only `'yaml_parse_failed'`; future
   *  reasons (e.g. `'missing_close_fence'`) extend this enum. */
  reason: 'yaml_parse_failed';
  /** ISO 8601 timestamp at flag time. */
  flagged_at: string;
  /** Short diagnostic from the parser, when available (truncated). */
  detail?: string;
}

/** Build the canonical marker object. Callers assign it onto the frontmatter
 *  before write so it persists into the page row:
 *
 *      parsed.frontmatter[MALFORMED_FRONTMATTER_KEY] = buildMalformedFrontmatterMarker();
 */
export function buildMalformedFrontmatterMarker(
  detail?: string,
  now: Date = new Date(),
): MalformedFrontmatterMarker {
  const marker: MalformedFrontmatterMarker = {
    reason: 'yaml_parse_failed',
    flagged_at: now.toISOString(),
  };
  if (detail) marker.detail = detail.slice(0, 200);
  return marker;
}

/** JS-side predicate for in-memory page objects. True when the frontmatter has
 *  the malformed key set to any non-null value. Accepts null/undefined and
 *  returns false. Mirrors the SQL fragment's key-existence semantics. */
export function isMalformedFrontmatter(
  frontmatter: Record<string, unknown> | null | undefined,
): boolean {
  if (!frontmatter) return false;
  const value = frontmatter[MALFORMED_FRONTMATTER_KEY];
  return value !== undefined && value !== null;
}
