import { describe, it, expect } from 'vitest';
import { PassThrough } from 'node:stream';
import { readHookInput } from '../src/parser/hookInput.js';

function fakeStdin(isTTY: boolean, chunks: string[] = []): NodeJS.ReadStream {
  const stream = new PassThrough();
  (stream as unknown as { isTTY?: boolean }).isTTY = isTTY;
  process.nextTick(() => {
    for (const c of chunks) stream.write(c);
    stream.end();
  });
  return stream as unknown as NodeJS.ReadStream;
}

describe('readHookInput', () => {
  it('TTY면 즉시 null', async () => {
    const stdin = fakeStdin(true, ['{"session_id":"a","transcript_path":"/x"}']);
    expect(await readHookInput(stdin)).toBeNull();
  });

  it('정상 JSON에서 session_id/transcript_path 추출 (context_window 없으면 null)', async () => {
    const stdin = fakeStdin(false, [
      JSON.stringify({ session_id: 'sess-1', transcript_path: '/tmp/a.jsonl', cwd: '/x' }),
    ]);
    expect(await readHookInput(stdin)).toEqual({
      sessionId: 'sess-1',
      transcriptPath: '/tmp/a.jsonl',
      contextRemainingPercent: null,
    });
  });

  it('필드 누락이면 null', async () => {
    const stdin = fakeStdin(false, [JSON.stringify({ session_id: 'sess-1' })]);
    expect(await readHookInput(stdin)).toBeNull();
  });

  it('손상된 JSON이면 null', async () => {
    const stdin = fakeStdin(false, ['not json']);
    expect(await readHookInput(stdin)).toBeNull();
  });

  it('빈 stdin이면 null', async () => {
    const stdin = fakeStdin(false, []);
    expect(await readHookInput(stdin)).toBeNull();
  });

  it('context_window.remaining_percentage를 그대로 사용', async () => {
    const stdin = fakeStdin(false, [
      JSON.stringify({
        session_id: 's1',
        transcript_path: '/x.jsonl',
        context_window: { remaining_percentage: 65 },
      }),
    ]);
    const result = await readHookInput(stdin);
    expect(result?.contextRemainingPercent).toBe(65);
  });

  it('remaining_percentage 없으면 used_percentage로 역산', async () => {
    const stdin = fakeStdin(false, [
      JSON.stringify({
        session_id: 's1',
        transcript_path: '/x.jsonl',
        context_window: { used_percentage: 30 },
      }),
    ]);
    const result = await readHookInput(stdin);
    expect(result?.contextRemainingPercent).toBe(70);
  });

  it('범위를 벗어난 값은 0~100으로 clamp', async () => {
    const stdin = fakeStdin(false, [
      JSON.stringify({
        session_id: 's1',
        transcript_path: '/x.jsonl',
        context_window: { remaining_percentage: 150 },
      }),
    ]);
    const result = await readHookInput(stdin);
    expect(result?.contextRemainingPercent).toBe(100);
  });

  it('context_window가 없거나 형태가 다르면 null', async () => {
    const stdin = fakeStdin(false, [
      JSON.stringify({ session_id: 's1', transcript_path: '/x.jsonl', context_window: 'nope' }),
    ]);
    const result = await readHookInput(stdin);
    expect(result?.contextRemainingPercent).toBeNull();
  });
});
