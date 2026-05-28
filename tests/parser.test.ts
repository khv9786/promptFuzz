import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseJsonlFile } from '../src/parser/jsonl-stream.js';

let tmpDir: string;
let jsonlPath: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'promptfuzz-test-'));
  jsonlPath = join(tmpDir, 'session.jsonl');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('parseJsonlFile', () => {
  it('빈 파일은 0 토큰', async () => {
    await writeFile(jsonlPath, '');
    const result = await parseJsonlFile(jsonlPath, 0);
    expect(result.delta.total).toBe(0);
  });

  it('usage 필드에서 input/output 토큰을 합산', async () => {
    const lines = [
      JSON.stringify({
        message: { usage: { input_tokens: 100, output_tokens: 50 } },
      }),
      JSON.stringify({
        message: { usage: { input_tokens: 200, output_tokens: 80 } },
      }),
    ];
    await writeFile(jsonlPath, lines.join('\n') + '\n');

    const result = await parseJsonlFile(jsonlPath, 0);
    expect(result.delta.inputTokens).toBe(300);
    expect(result.delta.outputTokens).toBe(130);
    expect(result.delta.total).toBe(430);
  });

  it('cache 관련 input 토큰도 input에 합산된다', async () => {
    const line = JSON.stringify({
      message: {
        usage: {
          input_tokens: 100,
          cache_creation_input_tokens: 50,
          cache_read_input_tokens: 30,
          output_tokens: 20,
        },
      },
    });
    await writeFile(jsonlPath, line + '\n');

    const result = await parseJsonlFile(jsonlPath, 0);
    expect(result.delta.inputTokens).toBe(180);
    expect(result.delta.outputTokens).toBe(20);
  });

  it('usage 없는 엔트리는 무시', async () => {
    const lines = [
      JSON.stringify({ message: { content: 'Hello' } }),
      JSON.stringify({ type: 'metadata' }),
      JSON.stringify({ message: { usage: { input_tokens: 10, output_tokens: 5 } } }),
    ];
    await writeFile(jsonlPath, lines.join('\n') + '\n');

    const result = await parseJsonlFile(jsonlPath, 0);
    expect(result.delta.total).toBe(15);
  });

  it('손상된 JSON 라인은 스킵', async () => {
    const lines = [
      'not a json',
      JSON.stringify({ message: { usage: { input_tokens: 100, output_tokens: 50 } } }),
      '{broken',
    ];
    await writeFile(jsonlPath, lines.join('\n') + '\n');

    const result = await parseJsonlFile(jsonlPath, 0);
    expect(result.delta.total).toBe(150);
  });

  it('fromOffset을 사용하면 증분 파싱', async () => {
    const firstBatch = JSON.stringify({
      message: { usage: { input_tokens: 100, output_tokens: 50 } },
    }) + '\n';
    await writeFile(jsonlPath, firstBatch);

    const first = await parseJsonlFile(jsonlPath, 0);
    expect(first.delta.total).toBe(150);

    const secondBatch = firstBatch + JSON.stringify({
      message: { usage: { input_tokens: 30, output_tokens: 20 } },
    }) + '\n';
    await writeFile(jsonlPath, secondBatch);

    const second = await parseJsonlFile(jsonlPath, first.newOffset);
    expect(second.delta.total).toBe(50);
  });
});
