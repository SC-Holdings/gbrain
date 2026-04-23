---
name: idea-triage
version: 1.0.0
description: |
  Stage-gate validation for business and technical ideas. Reads pipeline
  frontmatter (stage, kill_criteria, confidence) and advances ideas through
  gates: source → idea → hypothesis → experiment → result → killed.
  Use when: "triage this idea", "evaluate idea", "advance idea", "kill idea",
  "what stage is this idea", "idea pipeline status", "next step for idea".
triggers:
  - "triage this idea"
  - "evaluate idea"
  - "advance idea"
  - "kill this idea"
  - "idea pipeline status"
  - "what stage is"
  - "next step for idea"
tools:
  - search
  - query
  - get_page
  - put_page
  - add_link
  - add_timeline_entry
mutating: true
---

# Idea Triage Skill

> **Filing rule:** Read `skills/_brain-filing-rules.md` before creating any new page.

## Contract

This skill guarantees:
- Every idea page has pipeline frontmatter (stage, kill_criteria, confidence, gate_decisions)
- Stage transitions are recorded as gate_decisions with date, from, to, reason
- Kill criteria are evaluated before any stage advancement
- Business ideas use market/competition/revenue criteria
- Technical ideas use feasibility/impact/effort criteria
- No idea advances past a gate with `unknown` kill criteria still unresolved
- Every evaluation is written to the idea's timeline
- Telos alignment score is checked for strategic fit

## Phases

### Phase 1: Identify the Idea

If the user names a specific idea:
1. Search brain for the idea page: `gbrain search "{idea name}"`
2. If found, read the full page: `gbrain get {slug}`
3. Extract current pipeline state from frontmatter

If the user asks for pipeline status (no specific idea):
1. List all idea pages: `gbrain list --type idea`
2. Group by stage
3. Flag ideas stuck at a stage with `unknown` criteria for 14+ days
4. Present summary with next actions per idea

### Phase 2: Evaluate Current State

Read the idea's frontmatter and assess:

```yaml
stage: source | idea | hypothesis | experiment | result | killed
idea_type: business | technical
kill_criteria:
  # Business ideas:
  market_size: unknown | <value>     # must be >$100M
  competition: unknown | <value>     # must have defensible wedge
  revenue_path: unknown | <value>    # must hit $1K in 60 days
  # Technical ideas:
  feasibility: unknown | <value>     # must be buildable with current skills
  impact: unknown | <value>          # must improve a key metric by >20%
  effort: unknown | <value>          # must be achievable in <2 weeks
confidence: low | medium | high
telos_alignment: 0-10
next_required_evidence: "<what needs to be learned next>"
```

**Gate rules:**
- `source → idea`: Requires at least one signal confirming the problem exists
- `idea → hypothesis`: Requires all kill_criteria to have non-unknown values AND telos_alignment >= 5
- `hypothesis → experiment`: Requires a testable prediction with clear success/failure metrics
- `experiment → result`: Requires experiment data collected and analyzed
- `result → killed` or pipeline exit: Based on experiment outcome

### Phase 3: Strategic Evaluation (CEO Review Pattern)

For stage transitions at `idea → hypothesis` or higher:

Adopt the CEO review perspective (from /ceo-review):
1. **Strategic fit** — Does this align with Telos goals?
2. **User value** — Who benefits? What pain does it solve?
3. **Market timing** — Is now the right time?
4. **Resource reality** — Can Curtis build this solo with current constraints ($0 income, ADD)?
5. **Risk** — What's the downside? What's the kill scenario?

Write the evaluation as a timeline entry on the idea page.

### Phase 4: Gate Decision

Based on evaluation, recommend one of:
- **ADVANCE**: Move to next stage. Update `stage` in frontmatter. Record gate_decision.
- **HOLD**: Stay at current stage. Update `next_required_evidence` with what's needed.
- **KILL**: Set `stage: killed`. Record reason in gate_decision. This is permanent.
- **REFINE**: Stay at stage but update compiled truth with new evidence.

When advancing, update the frontmatter:

```yaml
gate_decisions:
  - date: YYYY-MM-DD
    from: <current_stage>
    to: <next_stage>
    reason: "<evidence-based justification>"
```

Update `confidence` based on evidence quality.
Update `next_required_evidence` for the new stage.

### Phase 5: Write Results

1. Update the idea page via `gbrain put {slug}` with new frontmatter + compiled truth
2. Add a timeline entry: `gbrain timeline-add {slug} {date} "{stage transition or evaluation summary}"`
3. If the idea mentions people or companies, ensure cross-links exist

## Output Format

```markdown
## Idea Triage: {title}

**Current stage:** {stage} → **Recommended:** {ADVANCE|HOLD|KILL|REFINE}
**Confidence:** {confidence}
**Telos alignment:** {telos_alignment}/10

### Kill Criteria Status
| Criterion | Status | Evidence |
|-----------|--------|----------|
| {criterion} | {value or unknown} | {source} |

### Strategic Evaluation
{CEO review perspective assessment}

### Gate Decision
**Action:** {ADVANCE|HOLD|KILL|REFINE}
**Reason:** {evidence-based justification}
**Next required evidence:** {what needs to happen next}
```

## Anti-Patterns

- DO NOT advance an idea with `unknown` kill criteria — gather evidence first
- DO NOT create new idea pages — that's idea-ingest's job. Triage only evaluates existing ideas.
- DO NOT run triage without reading the full idea page first
- DO NOT skip the strategic evaluation for hypothesis+ transitions
- DO NOT kill an idea without recording the specific reason
