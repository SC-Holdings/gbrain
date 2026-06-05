# GBrain Skill Resolver

This is the dispatcher. Skills are the implementation. **Read the skill file before acting.** If two skills could match, read both. They are designed to chain (e.g., ingest then enrich for each entity).

## Always-on (every message)

| Trigger | Skill |
|---------|-------|
| Every inbound message (spawn parallel, don't block) | `skills/signal-detector/SKILL.md` |
| Any brain read/write/lookup/citation | `skills/brain-ops/SKILL.md` |

## Brain operations

| Trigger | Skill |
|---------|-------|
| "What do we know about", "tell me about", "search for" | `skills/query/SKILL.md` |
| "Who knows who", "relationship between", "connections", "graph query" | `skills/query/SKILL.md` (use graph-query) |
| Creating/enriching a person or company page | `skills/enrich/SKILL.md` |
| Where does a new file go? Filing rules | `skills/repo-architecture/SKILL.md` |
| "where does this brain page go", "file this in the brain", "brain taxonomist", "taxonomy check", "refile brain page", "which directory does this page go" | `skills/brain-taxonomist/SKILL.md` |
| "EIIRP", "everything in its right place", "store this research", "put this in the brain", "make this re-doable", "DRY this up", "file all of this", "organize all of this work", "archive this research thread" | `skills/eiirp/SKILL.md` |
| Fix broken citations in brain pages | `skills/citation-fixer/SKILL.md` |
| "Research", "track", "extract from email", "investor updates", "donations" | `skills/data-research/SKILL.md` |
| Share a brain page as a link | `skills/publish/SKILL.md` |
| "Triage idea", "evaluate idea", "advance idea", "kill idea", "idea pipeline status" | `skills/idea-triage/SKILL.md` |
| "Triage inbox", "process inbox", "classify inbox", "clean inbox" | `skills/inbox-triage/SKILL.md` |
| "Promote signals to ideas", "check for new business ideas from influencers", "signal to idea promotion" | `skills/signal-to-idea/SKILL.md` |


## Namespace routing (brain filing by type)

| Namespace | Content Type | Primary Skill |
|-----------|-------------|---------------|
| ideas/ | Business and technical ideas with pipeline frontmatter | idea-triage (evaluation), idea-ingest (intake) |
| articles/ | Wiki-llm research articles (Karpathy schema) | data-research |
| concepts/ | Frameworks, mental models, reusable thinking | idea-ingest (create), query (read) |
| people/ | Person dossiers with compiled truth + timeline | enrich |
| companies/ | Company profiles | enrich |
| meetings/ | Meeting transcripts + summaries | meeting-ingestion |
| digests/ | Influencer pipeline daily digests | Cron-generated |
| reflections/ | Dream-cycle nightly reflections | Cron-generated |
| plans/ | Daily plans | daily-task-prep |

## Content & media ingestion

| Trigger | Skill |
|---------|-------|
| "capture this", "save this thought", "remember this", "drop this in the inbox", "save to brain" | `skills/capture/SKILL.md` |
| User shares a link, article, tweet, or idea | `skills/idea-ingest/SKILL.md` |
| Video, audio, PDF, book, YouTube, screenshot | `skills/media-ingest/SKILL.md` |
| Meeting transcript received | `skills/meeting-ingestion/SKILL.md` |
| Generic "ingest this" (auto-routes to above) | `skills/ingest/SKILL.md` |

## GStack Review Personas (native subagents via PR #4220)

| Trigger | Command | Focus |
|---------|---------|-------|
| "Review this strategically", "CEO review", "strategic fit" | /ceo-review | Strategic fit, user value, market timing |
| "Architecture review", "tech debt", "eng review" | /eng-review | Architecture, tech debt, maintainability |
| "Design review", "UX review", "accessibility" | /design-review | UX flow, visual design, accessibility |
| "Code review", "review this code", "production safety" | /reviewer | Code quality, testing, production safety |
| "QA audit", "test coverage", "edge cases" | /qa-audit | Testing, edge cases, user flows |
| "Security review", "OWASP", "compliance" | /cso | Security, OWASP, compliance |
| "Release check", "deployment safety", "rollback" | /release-check | Deployment strategy, rollback, monitoring |
| "List personas", "gstack" | /gstack | Show all available personas |

> These are native Hermes subagents (not external GStack dependency).
> Each persona spawns an isolated child agent with specialized system prompt.
> For business idea triage, /ceo-review is directly applicable.

## GStack Thinking Skills (original)

| Trigger | Skill |
|---------|-------|
| "Brainstorm", "I have an idea", "office hours" | GStack: office-hours |
| "Debug", "fix", "broken", "investigate" | GStack: investigate |
| "Retro", "what shipped", "retrospective" | GStack: retro |

> Original GStack thinking skills. Complementary to the review personas above.

## Operational

| Trigger | Skill |
|---------|-------|
| Task add/remove/complete/defer/review | `skills/daily-task-manager/SKILL.md` |
| Morning prep, meeting context, day planning | `skills/daily-task-prep/SKILL.md` |
| Daily briefing, "what's happening today" | `skills/briefing/SKILL.md` |
| Cron scheduling, quiet hours, job staggering | `skills/cron-scheduler/SKILL.md` |
| Save or load reports | `skills/reports/SKILL.md` |
| "Create a skill", "improve this skill" | `skills/skill-creator/SKILL.md` |
| "Skillify this", "is this a skill?", "make this proper" | `skills/skillify/SKILL.md` |
| "Is gbrain healthy?", morning health check, skillpack-check | `skills/skillpack-check/SKILL.md` |
| "harvest this skill into gbrain", "publish this skill to gbrain", "lift this skill upstream", "share this skill with other gbrain clients", "promote my skill to gbrain" | `skills/skillpack-harvest/SKILL.md` |
| Post-restart health + auto-fix, "did the container restart break anything", smoke test | `skills/smoke-test/SKILL.md` |
| Cross-modal review, second opinion | `skills/cross-modal-review/SKILL.md` |
| "Validate skills", skill health check | `skills/testing/SKILL.md` |
| Webhook setup, external event processing | `skills/webhook-transforms/SKILL.md` |
| "Spawn agent", "background task", "parallel tasks", "steer agent", "pause/resume agent" | `skills/minion-orchestrator/SKILL.md` |

## Setup & migration

| Trigger | Skill |
|---------|-------|
| "Set up GBrain", first boot | `skills/setup/SKILL.md` |
| "Migrate from Obsidian/Notion/Logseq" | `skills/migrate/SKILL.md` |
| Brain health check, maintenance run | `skills/maintain/SKILL.md` |
| "Extract links", "build link graph", "populate timeline" | `skills/maintain/SKILL.md` (extraction sections) |
| "Brain health", "what features am I missing", "brain score" | Run `gbrain features --json` |
| "Set up autopilot", "run brain maintenance", "keep brain updated" | Run `gbrain autopilot --install --repo ~/brain` |
| "Upgrade gbrain", "update gbrain", "gbrain update available", `UPGRADE_AVAILABLE`, "is gbrain up to date" | `skills/gbrain-upgrade/SKILL.md` |
| Agent identity, "who am I", customize agent | `skills/soul-audit/SKILL.md` |
| "Populate links", "extract links", "backfill graph" | `skills/maintain/SKILL.md` (graph population phase) |
| "Populate timeline", "extract timeline entries" | `skills/maintain/SKILL.md` (graph population phase) |

## Identity & access (always-on)

| Trigger | Skill |
|---------|-------|
| Non-owner sends a message | Check `ACCESS_POLICY.md` before responding |
| Agent needs to know its identity/vibe | Read `SOUL.md` |
| Agent needs user context | Read `USER.md` |
| Operational cadence (what to check and when) | Read `HEARTBEAT.md` |

## Disambiguation rules

When multiple skills could match:
1. Prefer the most specific skill (meeting-ingestion over ingest)
2. If the user mentions a URL, route by content type (link → idea-ingest, video → media-ingest)
3. If the user mentions a person/company, check if enrich or query fits better
4. Chaining is explicit in each skill's Phases section
5. When in doubt, ask the user

## Conventions (cross-cutting)

These apply to ALL brain-writing skills:
- `skills/conventions/quality.md` — citations, back-links, notability gate
- `skills/conventions/brain-first.md` — check brain before external APIs
- `skills/conventions/brain-routing.md` — which brain (DB) and which source (repo) to target; cross-brain federation is latent-space only
- `skills/conventions/schema-evolution.md` — when to add a type vs alias vs prefix (read before `schema-author`)
- `skills/conventions/subagent-routing.md` — when to use Minions vs inline work
- `skills/_brain-filing-rules.md` — where files go
- `skills/_output-rules.md` — output quality standards

## Uncategorized

| Trigger | Skill |
|---------|-------|
| "personalized version of this book", "mirror this book", "two-column book analysis", "apply this book to my life", "how does this book apply to me" | `skills/book-mirror/SKILL.md` |
| "enrich this article", "enrich brain pages", "batch enrich", "make brain pages useful" | `skills/article-enrichment/SKILL.md` |
| "strategic reading", "read this through the lens of", "apply this to my problem", "what can I learn from this about", "extract a playbook from" | `skills/strategic-reading/SKILL.md` |
| "concept synthesis", "synthesize my concepts", "find patterns across my notes", "build my intellectual map", "trace idea evolution" | `skills/concept-synthesis/SKILL.md` |
| "perplexity research", "what's new about", "current state of", "web research", "what changed about" | `skills/perplexity-research/SKILL.md` |
| "crawl my archive", "find gold in my archive", "archive crawler", "scan my dropbox for", "mine my old files for" | `skills/archive-crawler/SKILL.md` |
| "verify this academic claim", "check this study", "academic verify", "validate citation", "is this study real" | `skills/academic-verify/SKILL.md` |
| "make pdf from brain", "brain pdf", "convert brain page to pdf", "publish this page as pdf", "export brain page" | `skills/brain-pdf/SKILL.md` |
| "voice note", "ingest this voice memo", "transcribe and file", "voice note ingest", "save this audio note" | `skills/voice-note-ingest/SKILL.md` |
| "add a page type", "add a type to my schema", "schema author", "schema mutate", "schema pack add", "my brain has untyped pages", "propose new types from my corpus", "backfill page types", "evolve my schema", "researcher type", "make X an expert type" (dispatcher for: gbrain schema active/list/show/validate/graph/lint/stats/explain/use/downgrade/reload/init/fork/edit/diff/add-type/remove-type/update-type/add-alias/remove-alias/add-prefix/remove-prefix/add-link-type/remove-link-type/set-extractable/set-expert-routing/detect/suggest/review-candidates/review-orphans/sync) | `skills/schema-author/SKILL.md` |
| "validate frontmatter", "check frontmatter", "fix frontmatter", "frontmatter audit", "brain lint" | `skills/frontmatter-guard/SKILL.md` |
| "Now what?", "fill my brain", "cold start", "bootstrap", "import my data", "what should I import first" | `skills/cold-start/SKILL.md` |
| "present options", "ask before proceeding", "choice gate", "user decision" | `skills/ask-user/SKILL.md` |
| "Compress my resolver", "AGENTS.md too large", "RESOLVER.md too big", "functional area dispatcher", "shrink routing table" | `skills/functional-area-resolver/SKILL.md` |
| "unify my types", "migrate to gbrain-base-v2", "94 types to 14", "apply canonical taxonomy", "clean up my page types", "pack upgrade", "shrink type proliferation", "consolidate page types", "retype pages to canonical" (dispatcher for: gbrain onboard --check, gbrain onboard --check --explain, gbrain jobs submit unify-types, gbrain pages restore) | `skills/schema-unify/SKILL.md` |

