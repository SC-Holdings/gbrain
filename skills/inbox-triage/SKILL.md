---
name: inbox-triage
version: 1.0.0
description: |
  Three-tier classification of brain inbox items. Reads all pages with
  00-inbox/ prefix, classifies each into Tier 1 (high-value — route to
  ideas/articles/people/companies), Tier 2 (reference — keep as-is),
  or Tier 3 (noise — flag for deletion). Use when: triage inbox,
  process inbox, classify inbox items, clean inbox.
triggers:
  - "triage inbox"
  - "process inbox"
  - "classify inbox"
  - "clean inbox"
tools:
  - search
  - query
  - get_page
  - put_page
  - delete
mutating: true
---

# Inbox Triage Skill

> **Filing rule:** Read `skills/_brain-filing-rules.md` before routing any page.

## Contract

This skill guarantees:
- Every 00-inbox/ page gets classified into exactly one tier
- Tier 1 pages get moved to the correct namespace with proper frontmatter
- Tier 2 pages stay in brain but get proper type/tags
- Tier 3 pages are flagged (not auto-deleted without confirmation)
- Processing happens in batches of 20 to manage token budget

## Tiers

**Tier 1 — High Value (route to namespace):**
- Business or technical idea → `ideas/` with pipeline frontmatter
- Research article with analysis → `articles/` with source/author
- Person mentioned with context → `people/` (check if page exists first)
- Company with analysis → `companies/`
- Framework or mental model → `concepts/`

**Tier 2 — Reference (keep, reclassify):**
- Tool/library reference → keep, add proper tags
- Tutorial or how-to → keep as reference
- News item with context → keep if still relevant

**Tier 3 — Noise (flag for deletion):**
- Duplicate of existing brain page
- Empty or stub pages
- Outdated news without lasting value
- Capture artifacts (test clips, broken imports)

## Phases

### Phase 1: Scan Inbox

List all pages with 00-inbox/ prefix:
```
gbrain list --type concept -n 999
```
Filter to pages with slug starting with `00-inbox/`.

### Phase 2: Batch Classify (20 at a time)

For each batch of 20 pages:
1. Read each page title and first 200 characters
2. Classify into Tier 1/2/3
3. For Tier 1: determine target namespace
4. Present batch classification for confirmation

### Phase 3: Route Tier 1

For each Tier 1 page:
1. Read the full page content
2. Create new page in target namespace with proper frontmatter
3. Delete the 00-inbox/ page
4. Verify new page is searchable

### Phase 4: Tag Tier 2

For each Tier 2 page:
1. Update frontmatter with proper type and tags
2. Leave in current location (or move to appropriate namespace)

### Phase 5: Report Tier 3

List all Tier 3 pages with reason for deletion.
Do NOT auto-delete — present list and ask for confirmation.

## Output Format

```
## Inbox Triage Report

**Processed:** X pages
**Tier 1 (routed):** Y pages → [namespace breakdown]
**Tier 2 (kept):** Z pages
**Tier 3 (flagged):** W pages

### Tier 1 Routing
| Original | New Location | Type |
|----------|-------------|------|
| 00-inbox/foo | ideas/foo | idea |

### Tier 3 Flagged for Deletion
| Page | Reason |
|------|--------|
| 00-inbox/bar | Empty stub |
```

## Anti-Patterns

- ❌ Auto-deleting Tier 3. Noise is FLAGGED, never deleted without explicit confirmation — present the list and ask.
- ❌ Assigning more than one tier. Every `00-inbox/` page gets exactly one tier.
- ❌ Routing a Tier 1 page without reading it in full. Phase 2 reads title + first 200 chars to classify; Phase 3 reads the WHOLE page before creating the namespaced page.
- ❌ Skipping the filing rules. Read `skills/_brain-filing-rules.md` before routing any page — it owns namespace + frontmatter conventions.
- ❌ Routing a person/company without checking for an existing page first — that creates the duplicates triage exists to prevent.
- ❌ Blowing the token budget. Process in batches of 20; don't load the whole inbox at once.
