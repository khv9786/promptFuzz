import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PromptFuzzState } from '../src/types/index.js';

// storage/parser를 목킹해 --line이 순수 읽기(tick/스캔/저장 없음)임을 검증.
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

vi.mock('../src/parser/index.js', () => ({
  scanAllSessions: vi.fn(async () => ({
    totalDelta: { inputTokens: 0, outputTokens: 0, total: 0 },
    updatedOffsets: {},
  })),
  CLAUDE_PROJECTS_DIR: '/__nonexistent_for_test__',
}));

// 목킹 선언 후 import
import { formatCompactTokens, formatStatusLine } from '../src/commands/statusLine.js';
import { getStage } from '../src/state/stages.js';
import { statusCommand } from '../src/commands/status.js';
import * as storage from '../src/state/storage.js';
import * as parser from '../src/parser/index.js';

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
    ...overrides,
  };
}

describe('formatCompactTokens', () => {
  it('0은 그대로', () => {
    expect(formatCompactTokens(0)).toBe('0');
  });
  it('천 미만은 숫자 그대로', () => {
    expect(formatCompactTokens(999)).toBe('999');
  });
  it('천 단위는 K', () => {
    expect(formatCompactTokens(50_000)).toBe('50K');
    expect(formatCompactTokens(175_000)).toBe('175K');
    expect(formatCompactTokens(900_000)).toBe('900K');
  });
  it('백만 단위는 M (소수점 1자리)', () => {
    expect(formatCompactTokens(1_000_000)).toBe('1.0M');
    expect(formatCompactTokens(6_500_000)).toBe('6.5M');
    expect(formatCompactTokens(35_700_000)).toBe('35.7M');
  });
});

describe('formatStatusLine', () => {
  it('① 매끈 — 수염 글리프 포함, 면도 힌트 없음', () => {
    const s = getStage('smooth');
    expect(formatStatusLine(0, s)).toBe(`🧔 ${s.beardArt} ① 매끈 · 0`);
  });
  it('② 까끌까끌 — 면도 힌트 없음', () => {
    const s = getStage('stubble');
    const line = formatStatusLine(175_000, s);
    expect(line).toBe(`🧔 ${s.beardArt} ② 까끌까끌 · 175K`);
    expect(line).not.toContain('🪒');
  });
  it('③ 북슬북슬 — 면도 힌트 있음', () => {
    const s = getStage('bushy');
    expect(formatStatusLine(900_000, s)).toBe(`🧔 ${s.beardArt} ③ 북슬북슬 · 900K · 🪒 shave`);
  });
  it('④ 따갑따갑 — 수염 + 면도 힌트', () => {
    const line = formatStatusLine(3_250_000, getStage('rugged'));
    expect(line).toContain(getStage('rugged').beardArt);
    expect(line).toContain('④ 따갑따갑');
    expect(line).toContain('🪒 shave');
  });
  it('⑤ 고슴도치 — 수염 + 면도 힌트', () => {
    const line = formatStatusLine(6_500_000, getStage('hermit'));
    expect(line).toContain(getStage('hermit').beardArt);
    expect(line).toContain('⑤ 고슴도치');
    expect(line).toContain('🪒 shave');
  });
  it('항상 한 줄(개행 없음)', () => {
    expect(formatStatusLine(3_250_000, getStage('rugged'))).not.toContain('\n');
  });
});

describe('statusCommand({ line: true }) — 순수 읽기', () => {
  let logs: string[];
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logs = [];
    spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });
  });
  afterEach(() => spy.mockRestore());

  it('한 줄만 출력한다', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 3_250_000, currentStage: 'rugged' });
    await statusCommand({ line: true });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain('④ 따갑따갑');
    expect(logs[0]).toContain('🪒 shave');
  });

  it('tick을 호출하지 않는다 (scanAllSessions 미호출)', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 900_000, currentStage: 'bushy' });
    await statusCommand({ line: true });
    expect(parser.scanAllSessions).not.toHaveBeenCalled();
  });

  it('상태를 변경하지 않는다 (saveState 미호출)', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 900_000, currentStage: 'bushy' });
    await statusCommand({ line: true });
    expect(storage.saveState).not.toHaveBeenCalled();
  });
});
