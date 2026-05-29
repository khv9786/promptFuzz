import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PromptFuzzState, DailyEntry } from '../src/types/index.js';

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

import { logCommand } from '../src/commands/log.js';

function entry(o: Partial<DailyEntry> & { date: string }): DailyEntry {
  return { tokensAdded: 0, peakStage: 'smooth', shaveCount: 0, stretchCount: 0, ...o };
}

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
    statusViewCount: 0,
    quietHours: null,
    ...o,
  };
}

describe('logCommand', () => {
  let logs: string[];
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logs = [];
    logSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      logs.push(a.map(String).join(' '));
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('빈 dailyLog → 안내 메시지', async () => {
    hoisted.state.current = baseState({ dailyLog: {} });
    await logCommand({});
    const out = logs.join('\n');
    expect(out).toContain('아직 기록이 없어요');
  });

  it('기록 있으면 잔디 헤더 출력', async () => {
    hoisted.state.current = baseState({
      dailyLog: { '2026-05-01': entry({ date: '2026-05-01', tokensAdded: 30_000 }) },
    });
    await logCommand({ days: 30 });
    const out = logs.join('\n');
    expect(out).toContain('PromptFuzz log');
    expect(out).toContain('활동:');
  });

  it('--json → 구조화된 출력', async () => {
    hoisted.state.current = baseState({
      dailyLog: {
        '2026-05-28': entry({ date: '2026-05-28', tokensAdded: 60_000, shaveCount: 2, peakStage: 'stubble' }),
      },
    });
    await logCommand({ json: true });
    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.profile).toBe('medium');
    expect(parsed).toHaveProperty('entries');
    expect(parsed).toHaveProperty('totalShaves');
    expect(Array.isArray(parsed.entries)).toBe(true);
  });

  it('--days 7이면 entries 7개', async () => {
    hoisted.state.current = baseState({ dailyLog: { '2026-05-28': entry({ date: '2026-05-28', tokensAdded: 100 }) } });
    await logCommand({ json: true, days: 7 });
    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.days).toBe(7);
    expect(parsed.entries).toHaveLength(7);
  });

  it('--days 200이면 90으로 클램프', async () => {
    hoisted.state.current = baseState({ dailyLog: { '2026-05-28': entry({ date: '2026-05-28', tokensAdded: 100 }) } });
    await logCommand({ json: true, days: 200 });
    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.days).toBe(90);
  });
});
