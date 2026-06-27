---
name: signal-to-idea
version: 1.0.0
description: |
  Promote high-confidence influencer signals to gbrain idea pages. Reads
  classified signals with signal_type=business_idea and confidence=high
  (or convergence_score≥0.7), creates idea pages in ideas/ namespace with
  pipeline frontmatter. Use when: "promote signals to ideas", "check for
  new business ideas from influencers", "signal to idea promotion".
triggers:
  - "promote signals to ideas"
  - "check for new business ideas"
  - "signal to idea promotion"
tools:
  - search
  - query
  - get_page
  - put_page
  - add_link
  - add_timeline_entry
mutating: true
---

# Signal-to-Idea Promotion Skill

## Contract

This skill guarantees:
- Only signals with signal_type=business_idea AND (confidence=high OR convergence_score≥0.7) get promoted
- Each promoted signal creates ONE idea page in ideas/ with pipeline frontmatter
- Deduplication: checks if idea already exists in brain before creating
- Source signal is cross-linked (idea → person who posted, idea → source article)
- Promotion is logged in the idea's timeline

## Phases

### Phase 1: Read Classified Signals

Read today's classified signals from the influencer pipeline:
```bash
ls ~/.hermes/influencer-pipeline/classified/2026-04-22*.json 2>/dev/null
```

For each signal file, parse JSON and filter:
- signal_present = true
- signal_type = "business_idea"
- confidence = "high" OR convergence_score ≥ 0.7

### Phase 2: Dedup Against Brain

For each candidate signal:
1. `gbrain search "{primary_signal_statement}"`
2. If an idea page already exists with similar content, SKIP (log as duplicate)
3. If no match, proceed to creation

### Phase 3: Create Idea Page

```markdown
---
type: idea
title: "{primary_signal_statement}"
idea_type: business
stage: source
confidence: low
telos_alignment: 0
kill_criteria:
  market_size: unknown
  competition: unknown
  revenue_path: unknown
next_required_evidence: "Validate signal — is this a real opportunity or noise?"
gate_decisions:
  - date: YYYY-MM-DD
    from: signal
    to: source
    reason: "Influencer signal from {author_handle} (convergence: {score})"
tags: [{topic_tags}]
source_signal: "{platform}:{platform_post_id}"
---

## Compiled Truth

{why_it_matters}

Signal source: {author_handle} on {platform} ({evidence_type})
Convergence: {convergence_score} across {convergence_sources}

[Source: {platform_url}]

## Timeline

- **YYYY-MM-DD** | Promoted from influencer signal. {primary_signal_statement}
```

Write via `gbrain put ideas/{slug}`

### Phase 4: Cross-Link

Link the new idea to:
- The author's person page (if exists)
- Any related existing ideas (semantic search)

## Output

```
## Signal→Idea Promotion Report

Signals scanned: X
Candidates (business_idea + high confidence): Y
Duplicates skipped: Z
New ideas created: W

| New Idea | Source | Confidence |
|----------|--------|------------|
| {title} | {author} | {confidence} |
```

## Anti-Patterns

- ❌ Promoting below the bar. Only `signal_type=business_idea` AND (`confidence=high` OR `convergence_score≥0.7`) gets promoted; lower-confidence signals stay signals.
- ❌ Skipping the dedup search. Always `gbrain search` the signal statement first — a near-duplicate idea means SKIP-and-log, never a second page.
- ❌ Inventing confidence or alignment. New ideas enter at `stage: source`, `confidence: low`, `telos_alignment: 0` — promotion is provenance, not validation.
- ❌ Dropping the source link. Every idea cross-links back to the author's person page and the source post; an idea with no traceable signal is unfalsifiable.
- ❌ More than one page per signal, or writing outside `ideas/`. One signal → one `ideas/{slug}` page.

## Output Format

The output shape is the **Signal→Idea Promotion Report** documented in the `## Output` section above (signals scanned / candidates / duplicates skipped / new ideas created, plus the new-idea table). This literal header exists for the conformance test (`test/skills-conformance.test.ts`).
