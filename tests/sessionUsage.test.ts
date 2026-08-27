import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { updateCurrentSession } from '../src/state/index.js';
import type { PromptFuzzState } from '../src/types/index.js';
import type { HookInput } from '../src/parser/hookInput.js';

function hookInput(sessionId: string, transcriptPath: string): HookInput {
  return { sessionId, transcriptPath, contextRemainingPercent: null };
}

let tmpDir: string;
let transcriptPath: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'promptfuzz-session-test-'));
  transcriptPath = join(tmpDir, 'session.jsonl');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

function baseState(overrides: Partial<PromptFuzzState> = {}): PromptFuzzState {
  return {
    version: '1.0',
    installedAt: '2026-05-28T00:00:00Z',
    cumulativeTokens: 0,
    lastJsonlOffset: {},
    currentStage: 'smooth',
    shaveHistory: [],
    stretchCardsShown: [],
    onboardingShaveDone: true,
    thresholdProfile: 'medium',
    dailyLog: {},
    statusViewCount: 0,
    quietHours: null,
    currentSession: null,
    ...overrides,
  };
}

function usageLine(input: number, output: number): string {
  return JSON.stringify({ message: { usage: { input_tokens: input, output_tokens: output } } }) + '\n';
}

describe('updateCurrentSession', () => {
  it('hookInput이 없으면 state를 그대로 반환', async () => {
    const state = baseState();
    const result = await updateCurrentSession(state, null);
    expect(result).toBe(state);
  });

  it('새 세션이면 파일 처음부터 읽어 currentSession을 채운다', async () => {
    await writeFile(transcriptPath, usageLine(100, 50));
    const state = baseState();

    const result = await updateCurrentSession(state, hookInput('s1', transcriptPath));

    expect(result.currentSession?.id).toBe('s1');
    expect(result.currentSession?.tokens).toBe(150);
  });

  it('같은 세션이면 offset부터 증분만 더한다', async () => {
    await writeFile(transcriptPath, usageLine(100, 50));
    let state = baseState();
    state = await updateCurrentSession(state, hookInput('s1', transcriptPath));
    expect(state.currentSession?.tokens).toBe(150);

    await writeFile(transcriptPath, usageLine(100, 50) + usageLine(30, 20));
    state = await updateCurrentSession(state, hookInput('s1', transcriptPath));

    expect(state.currentSession?.tokens).toBe(200);
  });

  it('session_id가 바뀌면 처음부터 다시 센다', async () => {
    await writeFile(transcriptPath, usageLine(100, 50));
    let state = baseState();
    state = await updateCurrentSession(state, hookInput('s1', transcriptPath));
    expect(state.currentSession?.tokens).toBe(150);

    const secondPath = join(tmpDir, 'session2.jsonl');
    await writeFile(secondPath, usageLine(10, 5));
    state = await updateCurrentSession(state, hookInput('s2', secondPath));

    expect(state.currentSession?.id).toBe('s2');
    expect(state.currentSession?.tokens).toBe(15);
  });

  it('파일이 없으면 state를 그대로 반환 (렌더링 방해 금지)', async () => {
    const state = baseState();
    const result = await updateCurrentSession(state, hookInput('s1', join(tmpDir, 'nonexistent.jsonl')));
    expect(result).toBe(state);
  });
});
