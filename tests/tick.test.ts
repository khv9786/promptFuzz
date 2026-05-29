import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import chalk from 'chalk';
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
import { tickCommand } from '../src/commands/tick.js';

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
    ...overrides,
  };
}

describe('tickCommand 출력', () => {
  let logs: string[];
  let spy: ReturnType<typeof vi.spyOn>;
  let previousChalkLevel: number;

  beforeEach(() => {
    // ANSI 색상 코드가 문자열 매칭을 깨뜨리지 않도록 chalk를 무색 모드로.
    previousChalkLevel = chalk.level;
    chalk.level = 0;

    logs = [];
    spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });
  });

  afterEach(() => {
    spy.mockRestore();
    chalk.level = previousChalkLevel;
  });

  // medium 프로필 임계치: stubble 50K / bushy 300K / rugged 1.5M / hermit 5M

  it('단계 변화가 없으면 아무것도 출력하지 않는다', async () => {
    hoisted.state.current = baseState({
      cumulativeTokens: 50_000,
      currentStage: 'stubble',
    });
    hoisted.scan.current = {
      totalDelta: { inputTokens: 0, outputTokens: 0, total: 0 },
      updatedOffsets: {},
    };

    await tickCommand();

    expect(logs).toHaveLength(0);
  });

  it('① 매끈 → ② 까끌까끌 상승 시 알림 출력, 안내(shave) 없음', async () => {
    hoisted.state.current = baseState({
      cumulativeTokens: 0,
      currentStage: 'smooth',
    });
    hoisted.scan.current = {
      totalDelta: { inputTokens: 30_000, outputTokens: 20_001, total: 50_001 },
      updatedOffsets: {},
    };

    await tickCommand();

    const out = logs.join('\n');
    expect(out).toContain('━');
    expect(out).toContain('수염이 자랐어요');
    expect(out).toContain('매끈');
    expect(out).toContain('까끌까끌');
    expect(out).not.toContain('promptfuzz shave');
    expect(out).not.toContain('💡');
  });

  it('② 까끌까끌 → ④ 따갑따갑 상승 시 알림 + 안내(shave) 포함', async () => {
    hoisted.state.current = baseState({
      cumulativeTokens: 50_000,
      currentStage: 'stubble',
    });
    hoisted.scan.current = {
      totalDelta: { inputTokens: 800_000, outputTokens: 650_001, total: 1_450_001 },
      updatedOffsets: {},
    };

    await tickCommand();

    const out = logs.join('\n');
    expect(out).toContain('━');
    expect(out).toContain('수염이 자랐어요');
    expect(out).toContain('까끌까끌');
    expect(out).toContain('따갑따갑');
    expect(out).toContain('promptfuzz shave');
    expect(out).toContain('💡');
  });
});
