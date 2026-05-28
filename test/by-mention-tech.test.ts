import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { PGLiteEngine } from '../src/core/pglite-engine.ts';
import { resetPgliteState } from './helpers/reset-pglite.ts';
import { importFromContent } from '../src/core/import-file.ts';
import { buildGazetteer, findMentionedEntities } from '../src/core/by-mention.ts';

let engine: PGLiteEngine;

beforeAll(async () => {
  engine = new PGLiteEngine();
  await engine.connect({});
  await engine.initSchema();
});

afterAll(async () => {
  await engine.disconnect();
});

beforeEach(async () => {
  await resetPgliteState(engine);
});

/**
 * Mechanism-agnostic test for tech entity-mention linking.
 *
 * Asserts the OUTCOME (a prose mention of a tech-typed page's title produces a
 * mentions link to it), NOT the configuration mechanism. This test must pass
 * unchanged whether `tech` is enabled via a hardcoded LINKABLE_ENTITY_TYPES
 * addition (D12 pragmatic) or via the deferred pack-aware TODO-1 flag (ISC-84,
 * D14) — that is the transfer requirement so the test carries forward to the
 * full pack-aware implementation.
 */
describe('by-mention links tech-typed pages (outcome, mechanism-agnostic)', () => {
  test('a prose mention of a tech page title creates a mentions link', async () => {
    // A tech entity page with a proper-noun title (the kind tech titles tend to be).
    await importFromContent(engine, 'tech/hermes-agent',
      '---\ntype: tech\ntitle: "Hermes Agent"\n---\n\nThe runtime.',
      { noEmbed: true });

    // A note that mentions the tech entity in prose (no [[wikilink]]).
    await importFromContent(engine, 'analysis/some-note',
      '---\ntype: analysis\ntitle: "A note"\n---\n\nWe evaluated Hermes Agent for orchestration.',
      { noEmbed: true });

    const gaz = await buildGazetteer(engine);
    const mentions = findMentionedEntities(
      'We evaluated Hermes Agent for orchestration.',
      gaz,
      { fromSlug: 'analysis/some-note', fromSourceId: 'default' },
    );

    expect(mentions.map(m => m.slug)).toContain('tech/hermes-agent');
  });

  test('a well-formed tech title (proper-noun, >= MIN_NAME_LENGTH) appears in the gazetteer', async () => {
    await importFromContent(engine, 'tech/pytorch',
      '---\ntype: tech\ntitle: "PyTorch"\n---\n\nML framework.',
      { noEmbed: true });

    const gaz = await buildGazetteer(engine);
    // Gazetteer is keyed by first lowercase token. Should contain a bucket for 'pytorch'.
    const bucket = gaz.get('pytorch');
    expect(bucket).toBeTruthy();
    expect(bucket!.some(e => e.slug === 'tech/pytorch')).toBe(true);
  });
});
