import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PromptFuzzState } from '../src/types/index.js';

/**
 * E2E: install → tick(단계 상승) → shave → dailyLog → stats → reset 흐름을
 * 실제 상태 엔진 함수로 연결해 검증한다. ~/.promptfuzz는 메모리 모킹으로 격리
 * (실제 파일시스템/사용자 홈은 건드리지 않음).
 */

const hoisted = vi.hoisted(() => ({
  state: { current: null as PromptFuzzState | null },
  scanTotal: { value: 0 },
  hookInstalled: { value: false },
}));

vi.mock('../src/state/storage.js', () => ({
  ensureDir: vi.fn(async () => {}),
  loadState: vi.fn(async () => hoisted.state.current!),
  saveState: vi.fn(async (s: PromptFuzzState) => {
    hoisted.state.current = s;
  }),
  PROMPTFUZZ_DIR: '/fake/.promptfuzz',
  STATE_FILE: '/fake/.promptfuzz/state.json',
}));

vi.mock('../src/parser/index.js', () => ({
  scanAllSessions: vi.fn(async () => ({
    totalDelta: { inputTokens: hoisted.scanTotal.value, outputTokens: 0, total: hoisted.scanTotal.value },
    updatedOffsets: {},
  })),
  CLAUDE_PROJECTS_DIR: '/fake/.claude/projects',
}));

vi.mock('../src/hooks/manager.js', () => ({
  installHook: vi.fn(async () => {
    hoisted.hookInstalled.value = true;
    return { alreadyInstalled: false };
  }),
  uninstallHook: vi.fn(async () => {
    const was = hoisted.hookInstalled.value;
    hoisted.hookInstalled.value = false;
    return { removed: was };
  }),
  isInstalled: vi.fn(async () => hoisted.hookInstalled.value),
  CLAUDE_SETTINGS: '/fake/.claude/settings.json',
}));

import { installHook } from '../src/hooks/manager.js';
import { tick, performShave } from '../src/state/index.js';
import { computeStats } from '../src/state/stats.js';

function freshState(): PromptFuzzState {
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
  };
}

describe('E2E: 전체 사용자 흐름', () => {
  beforeEach(() => {
    hoisted.state.current = freshState();
    hoisted.scanTotal.value = 0;
    hoisted.hookInstalled.value = false;
  });

  it('install → tick(상승) → shave → dailyLog → stats → reset', async () => {
    // 1. install
    await installHook();
    expect(hoisted.hookInstalled.value).toBe(true);

    // 2. 토큰 누적 (medium 기준 ③ 북슬북슬 300K 이상) → 3. tick 단계 상승
    hoisted.scanTotal.value = 350_000;
    const t = await tick();
    expect(t.stageChanged).toBe(true);
    expect(t.stage.id).toBe('bushy');
    expect(hoisted.state.current!.cumulativeTokens).toBe(350_000);
    // dailyLog에 토큰 기록됨
    const today = Object.keys(hoisted.state.current!.dailyLog)[0]!;
    expect(hoisted.state.current!.dailyLog[today]!.tokensAdded).toBe(350_000);
    expect(hoisted.state.current!.dailyLog[today]!.peakStage).toBe('bushy');

    // 4. shave → 카운터 리셋 + dailyLog shaveCount
    await performShave();
    expect(hoisted.state.current!.cumulativeTokens).toBe(0);
    expect(hoisted.state.current!.currentStage).toBe('smooth');
    expect(hoisted.state.current!.shaveHistory).toHaveLength(1);
    expect(hoisted.state.current!.shaveHistory[0]!.tokensAtShave).toBe(350_000);
    expect(hoisted.state.current!.dailyLog[today]!.shaveCount).toBe(1);

    // 5. stats → 통계 계산
    const stats = computeStats(hoisted.state.current!, 90);
    expect(stats.activeDays).toBe(1);
    expect(stats.totalTokens).toBe(350_000);
    expect(stats.totalShaves).toBe(1);
    expect(stats.heaviestShave?.tokensAtShave).toBe(350_000);

    // 6. reset 시뮬레이션 (uninstall + state 초기화)
    const { uninstallHook } = await import('../src/hooks/manager.js');
    await uninstallHook();
    hoisted.state.current = freshState();
    expect(hoisted.hookInstalled.value).toBe(false);
    expect(hoisted.state.current.cumulativeTokens).toBe(0);
    expect(hoisted.state.current.shaveHistory).toHaveLength(0);
    expect(Object.keys(hoisted.state.current.dailyLog)).toHaveLength(0);
  });
});
