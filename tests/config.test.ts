import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PromptFuzzState } from '../src/types/index.js';

const hoisted = vi.hoisted(() => ({
  state: { current: null as PromptFuzzState | null },
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

import { configCommand } from '../src/commands/config.js';

function baseState(o: Partial<PromptFuzzState> = {}): PromptFuzzState {
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
    ...o,
  };
}

describe('configCommand', () => {
  let logs: string[];
  let errs: string[];
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logs = [];
    errs = [];
    logSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      logs.push(a.map(String).join(' '));
    });
    errSpy = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
      errs.push(a.map(String).join(' '));
    });
    process.exitCode = 0;
  });

  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    process.exitCode = 0;
  });

  it('인자 없음 → 현재 프로필 + 임계치 표시', async () => {
    hoisted.state.current = baseState({ thresholdProfile: 'medium' });
    await configCommand({});
    const out = logs.join('\n');
    expect(out).toContain('medium');
    expect(out).toContain('임계치');
    expect(out).toContain('50,000'); // medium stubble
  });

  it('--threshold heavy → 프로필 변경 + currentStage 재계산', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 1_200_000, thresholdProfile: 'medium' });
    await configCommand({ threshold: 'heavy' });
    expect(hoisted.state.current!.thresholdProfile).toBe('heavy');
    // 1.2M: heavy 기준 bushy(1M) 이상 rugged(5M) 미만 → bushy
    expect(hoisted.state.current!.currentStage).toBe('bushy');
    expect(logs.join('\n')).toContain("'heavy'");
  });

  it('잘못된 프로필 → 에러 + exitCode 1, 변경 없음', async () => {
    hoisted.state.current = baseState({ thresholdProfile: 'medium' });
    await configCommand({ threshold: 'ultra' });
    expect(process.exitCode).toBe(1);
    expect(hoisted.state.current!.thresholdProfile).toBe('medium');
    expect(errs.join('\n')).toContain('ultra');
  });

  it('--threshold (값 없음, true) → 프로필 목록 안내', async () => {
    hoisted.state.current = baseState();
    await configCommand({ threshold: true });
    const out = logs.join('\n');
    expect(out).toContain('light');
    expect(out).toContain('medium');
    expect(out).toContain('heavy');
  });
});
