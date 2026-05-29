import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PassThrough } from 'node:stream';
import type { PromptFuzzState } from '../src/types/index.js';

// vi.mock 팩토리는 호이스팅되므로, mutable 핸들을 vi.hoisted로 노출한다.
const hoisted = vi.hoisted(() => ({
  state: { current: null as PromptFuzzState | null },
  scan: {
    current: {
      totalDelta: { inputTokens: 0, outputTokens: 0, total: 0 },
      updatedOffsets: {} as Record<string, number>,
    },
  },
}));

vi.mock('../src/state/storage.js', () => ({
  ensureDir: vi.fn(async () => {}),
  loadState: vi.fn(async () => hoisted.state.current!),
  saveState: vi.fn(async (s: PromptFuzzState) => {
    hoisted.state.current = s;
  }),
  PROMPTFUZZ_DIR: '',
  STATE_FILE: '',
}));

vi.mock('../src/parser/index.js', () => ({
  scanAllSessions: vi.fn(async () => hoisted.scan.current),
  CLAUDE_PROJECTS_DIR: '/__nonexistent_for_test__',
}));

// 모킹 선언 후에 import (테스트 대상)
import { skipToEnd, runOnboardingShave } from '../src/state/onboarding.js';

function baseState(overrides: Partial<PromptFuzzState> = {}): PromptFuzzState {
  return {
    version: '1.0',
    installedAt: '2026-05-28T00:00:00Z',
    cumulativeTokens: 0,
    lastJsonlOffset: {},
    currentStage: 'smooth',
    shaveHistory: [],
    stretchCardsShown: [],
    onboardingShaveDone: false,
    thresholdProfile: 'medium',
    dailyLog: {},
    statusViewCount: 0,
    quietHours: null,
    ...overrides,
  };
}

describe('PromptFuzzState 타입', () => {
  it('onboardingShaveDone 초기값은 false', () => {
    const s = baseState();
    expect(s.onboardingShaveDone).toBe(false);
  });
});

describe('skipToEnd', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'promptfuzz-onboard-'));
  });

  it('JSONL 파일들의 size를 반환하고, 본문을 메모리에 올리지 않는다', async () => {
    const fileA = join(tmpDir, 'a.jsonl');
    const fileB = join(tmpDir, 'b.jsonl');
    const contentA = '{"x":1}\n{"y":2}\n';
    const contentB = '{"z":3}\n';
    await writeFile(fileA, contentA);
    await writeFile(fileB, contentB);

    const offsets = await skipToEnd(tmpDir);

    expect(offsets[fileA]).toBe(Buffer.byteLength(contentA, 'utf-8'));
    expect(offsets[fileB]).toBe(Buffer.byteLength(contentB, 'utf-8'));
    expect(Object.keys(offsets)).toHaveLength(2);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('존재하지 않는 디렉토리는 빈 객체 반환', async () => {
    const offsets = await skipToEnd(join(tmpDir, 'nope'));
    expect(offsets).toEqual({});
    await rm(tmpDir, { recursive: true, force: true });
  });
});

describe('runOnboardingShave', () => {
  beforeEach(() => {
    hoisted.state.current = baseState();
    hoisted.scan.current = {
      totalDelta: { inputTokens: 0, outputTokens: 0, total: 0 },
      updatedOffsets: {},
    };
  });

  it('이미 완료된 경우 즉시 skip-silent 반환, state 변경 없음', async () => {
    hoisted.state.current = baseState({
      onboardingShaveDone: true,
      cumulativeTokens: 999_999,
    });

    const before = hoisted.state.current;
    const r = await runOnboardingShave({
      output: new PassThrough(),
      input: new PassThrough(),
      isTTY: false,
    });

    expect(r.choice).toBe('skip-silent');
    expect(hoisted.state.current).toBe(before);
  });

  it('누적이 임계치(10K) 미만이면 조용히 onboardingShaveDone=true 박고 종료', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 0 });
    hoisted.scan.current = {
      totalDelta: { inputTokens: 5_000, outputTokens: 4_000, total: 9_000 },
      updatedOffsets: {},
    };

    const r = await runOnboardingShave({
      output: new PassThrough(),
      input: new PassThrough(),
      isTTY: false,
    });

    expect(r.choice).toBe('skip-silent');
    expect(hoisted.state.current!.onboardingShaveDone).toBe(true);
    expect(hoisted.state.current!.cumulativeTokens).toBe(9_000);
  });

  it('비대화형 + 누적 >= 임계치 → 자동 shave (cumulativeTokens=0)', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 0 });
    hoisted.scan.current = {
      totalDelta: { inputTokens: 6_000_000, outputTokens: 7_000_000, total: 13_000_000 },
      updatedOffsets: {},
    };

    const r = await runOnboardingShave({
      output: new PassThrough(),
      input: new PassThrough(),
      isTTY: false,
    });

    expect(r.choice).toBe('shave');
    expect(hoisted.state.current!.cumulativeTokens).toBe(0);
    expect(hoisted.state.current!.currentStage).toBe('smooth');
    expect(hoisted.state.current!.onboardingShaveDone).toBe(true);
  });

  it('두 번 호출해도 두 번째는 skip-silent (재발동 방지)', async () => {
    hoisted.scan.current = {
      totalDelta: { inputTokens: 0, outputTokens: 0, total: 50_000 },
      updatedOffsets: {},
    };

    const first = await runOnboardingShave({
      output: new PassThrough(),
      input: new PassThrough(),
      isTTY: false,
    });
    expect(first.choice).toBe('shave');

    hoisted.scan.current = {
      totalDelta: { inputTokens: 0, outputTokens: 0, total: 100_000 },
      updatedOffsets: {},
    };

    const second = await runOnboardingShave({
      output: new PassThrough(),
      input: new PassThrough(),
      isTTY: false,
    });
    expect(second.choice).toBe('skip-silent');
  });
});
