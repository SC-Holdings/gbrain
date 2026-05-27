import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { PGLiteEngine } from '../src/core/pglite-engine.ts';
import { resetPgliteState } from './helpers/reset-pglite.ts';
import { withEnv } from './helpers/with-env.ts';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { importFromContent } from '../src/core/import-file.ts';
import {
  isMalformedFrontmatter,
  MALFORMED_FRONTMATTER_KEY,
} from '../src/core/malformed-frontmatter.ts';
import { parseMarkdown } from '../src/core/markdown.ts';

let engine: PGLiteEngine;
let gbrainHomeDir: string;
let auditDir: string;

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

async function withIsolatedHome<T>(fn: () => Promise<T>): Promise<T> {
  gbrainHomeDir = mkdtempSync(join(tmpdir(), 'mf-home-'));
  auditDir = mkdtempSync(join(tmpdir(), 'mf-audit-'));
  try {
    return await withEnv({ GBRAIN_HOME: gbrainHomeDir, GBRAIN_AUDIT_DIR: auditDir }, fn);
  } finally {
    rmSync(gbrainHomeDir, { recursive: true, force: true });
    rmSync(auditDir, { recursive: true, force: true });
  }
}

describe('parseMarkdown — frontmatterParseFailed signal', () => {
  test('flags true when an unquoted colon breaks YAML', () => {
    const content = `---
title: Jensen Huang: three next AI waves
type: thesis
---

Body.`;
    const parsed = parseMarkdown(content, 'concepts/x.md');
    expect(parsed.frontmatterParseFailed).toBe(true);
  });

  test('flags false for well-formed (quoted) frontmatter', () => {
    const content = `---
title: "Jensen Huang: three next AI waves"
type: thesis
---

Body.`;
    const parsed = parseMarkdown(content, 'concepts/x.md');
    expect(parsed.frontmatterParseFailed).toBeFalsy();
  });
});

describe('importFromContent — malformed-frontmatter warn-and-flag', () => {
  test('colon-in-title page lands flagged instead of silently mistyped', async () => {
    await withIsolatedHome(async () => {
      const content = `---
title: Jensen Huang: three next AI waves
type: thesis
source_author: '@MatthewBerman'
---

The directional thesis body survives.`;
      const res = await importFromContent(engine, 'concepts/jensen-colon', content, { noEmbed: true });
      expect(res.status).not.toBe('error');

      const page = await engine.getPage('concepts/jensen-colon');
      expect(page).toBeTruthy();
      // Raw content preserved (lossless).
      expect(page!.compiled_truth).toContain('directional thesis body survives');
      // Flagged, not silent.
      expect(isMalformedFrontmatter(page!.frontmatter)).toBe(true);
      expect((page!.frontmatter as Record<string, unknown>)[MALFORMED_FRONTMATTER_KEY]).toBeTruthy();
    });
  });

  test('well-formed page is NOT flagged', async () => {
    await withIsolatedHome(async () => {
      const content = `---
title: "Jensen Huang: three next AI waves"
type: thesis
source_author: "@MatthewBerman"
---

Body.`;
      await importFromContent(engine, 'concepts/jensen-quoted', content, { noEmbed: true });
      const page = await engine.getPage('concepts/jensen-quoted');
      expect(page).toBeTruthy();
      expect(isMalformedFrontmatter(page!.frontmatter)).toBe(false);
      expect(page!.type).toBe('thesis');
    });
  });
});
