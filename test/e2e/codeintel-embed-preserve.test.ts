/**
 * 2026-06-21 — code-intel durability regression.
 *
 * Bug: the embed step (embed.ts) rebuilds chunks keeping only
 * index/text/source/embedding/token_count, then upsertChunks does
 * `symbol_name = EXCLUDED.symbol_name` (= NULL) → a re-embed of a code page
 * strips its symbol metadata → code_def/code_refs return nothing.
 *
 * Fix: upsertChunks ON CONFLICT now COALESCE-preserves the code-symbol
 * columns when the incoming row omits them (mirrors the embedding/model
 * preserve-on-null already in that statement). This test pins it on PGLite
 * (postgres-engine.ts carries the identical SQL).
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { PGLiteEngine } from '../../src/core/pglite-engine.ts';
import { configureGateway, resetGateway } from '../../src/core/ai/gateway.ts';

let engine: PGLiteEngine;
let DIMS: number;

beforeAll(async () => {
  resetGateway();
  configureGateway({
    embedding_model: 'openai:text-embedding-3-large',
    embedding_dimensions: 1536,
    env: { OPENAI_API_KEY: 'sk-test-fake-key-for-stub' },
  });
  DIMS = 1536;
  engine = new PGLiteEngine();
  await engine.connect({});
  await engine.initSchema();
});

afterAll(async () => { await engine.disconnect(); });

beforeEach(async () => {
  await engine.executeRaw(`DELETE FROM pages WHERE slug = $1`, ['test/codeintel-target']);
  await engine.executeRaw(
    `INSERT INTO pages (source_id, slug, type, title, compiled_truth)
     VALUES ('default', $1, 'concept', 'Code-intel preserve test', 'body')`,
    ['test/codeintel-target'],
  );
});

function makeVector(seed: number): Float32Array {
  const v = new Float32Array(DIMS);
  for (let i = 0; i < DIMS; i++) v[i] = seed + i * 0.001;
  return v;
}

describe('code-intel survives a metadata-less re-embed (COALESCE preserve)', () => {
  test('symbol metadata is preserved when embed re-upserts the chunk without it', async () => {
    // Step 1 — code import (strategy=code, --no-embed): symbols set, no embedding yet.
    await engine.upsertChunks('test/codeintel-target', [{
      chunk_index: 0,
      chunk_text: 'export function BrainEngine() {}',
      chunk_source: 'fenced_code',
      token_count: 6,
      language: 'typescript',
      symbol_name: 'BrainEngine',
      symbol_type: 'function',
      start_line: 10,
      end_line: 20,
      symbol_name_qualified: 'mod.BrainEngine',
    }], { sourceId: 'default' });

    let chunks = await engine.getChunks('test/codeintel-target', { sourceId: 'default' });
    expect(chunks.length).toBe(1);
    expect((chunks[0] as any).symbol_name).toBe('BrainEngine');
    expect((chunks[0] as any).embedded_at == null).toBe(true);

    // Step 2 — embed re-upserts the SAME chunk WITH an embedding but WITHOUT symbol metadata
    // (exactly embed.ts's chunks.map → {index,text,source,embedding,token_count}).
    await engine.upsertChunks('test/codeintel-target', [{
      chunk_index: 0,
      chunk_text: 'export function BrainEngine() {}',
      chunk_source: 'fenced_code',
      embedding: makeVector(1.0),
      token_count: 6,
    }], { sourceId: 'default' });

    chunks = await engine.getChunks('test/codeintel-target', { sourceId: 'default' });
    expect(chunks.length).toBe(1);
    // THE FIX: symbol metadata survives the metadata-less re-embed.
    expect((chunks[0] as any).symbol_name).toBe('BrainEngine');
    expect((chunks[0] as any).language).toBe('typescript');
    expect((chunks[0] as any).symbol_type).toBe('function');
    expect(Number((chunks[0] as any).start_line)).toBe(10);
    expect((chunks[0] as any).symbol_name_qualified).toBe('mod.BrainEngine');
  });

  test('a genuine symbol change still wins (COALESCE does not freeze values)', async () => {
    await engine.upsertChunks('test/codeintel-target', [{
      chunk_index: 0, chunk_text: 'x', chunk_source: 'fenced_code', symbol_name: 'OldName',
    }], { sourceId: 'default' });
    await engine.upsertChunks('test/codeintel-target', [{
      chunk_index: 0, chunk_text: 'x', chunk_source: 'fenced_code', symbol_name: 'NewName',
    }], { sourceId: 'default' });
    const chunks = await engine.getChunks('test/codeintel-target', { sourceId: 'default' });
    expect((chunks[0] as any).symbol_name).toBe('NewName');
  });
});
