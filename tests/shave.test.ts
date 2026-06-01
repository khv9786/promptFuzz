import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PromptFuzzState } from '../src/types/index.js';

// Phase 0.3 패턴: storage 모킹으로 ~/.promptfuzz 격리
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

import { shaveCommand } from '../src/commands/shave.js';
import {
  reduceShave,
  requiredKeyCount,
  shavedBeard,
  INITIAL_SHAVE_STATE,
  TOTAL_SHAVE_STEPS,
  type ShaveStateInternal,
} from '../src/ui/shaveReducer.js';

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

describe('shaveCommand 비대화형', () => {
  let logs: string[];
  let logSpy: ReturnType<typeof vi.spyOn>;
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logs = [];
    logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });
    // 첫 카드(turtle-neck)가 선택되도록 고정
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    logSpy.mockRestore();
    randomSpy.mockRestore();
  });

  it('토큰이 있으면 자동 면도 + 스트레칭 카드 + 기록', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 50_000, currentStage: 'bushy' });

    await shaveCommand({ isTTY: false });

    expect(hoisted.state.current!.cumulativeTokens).toBe(0);
    expect(hoisted.state.current!.shaveHistory).toHaveLength(1);
    expect(hoisted.state.current!.stretchCardsShown).toEqual(['turtle-neck']);

    const out = logs.join('\n');
    expect(out).toContain('면도 시작');
    expect(out).toContain('매끈해졌어요');
    expect(out).toContain('🧘');
  });

  it('토큰 0이면 면도 건너뛰고 스트레칭만', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 0 });

    await shaveCommand({ isTTY: false });

    expect(hoisted.state.current!.shaveHistory).toHaveLength(0);
    expect(hoisted.state.current!.stretchCardsShown).toHaveLength(1);

    const out = logs.join('\n');
    expect(out).toContain('이미 매끈해요');
    expect(out).toContain('🧘');
  });
});

describe('reduceShave (ShaveGame 상태 전이)', () => {
  it('intro 단계에서 any-key → shaving phase 진입', () => {
    const r = reduceShave(INITIAL_SHAVE_STATE, { type: 'any-key' });
    expect(r.state.phase).toBe('shaving');
    expect(r.state.progress).toBe(0);
    expect(r.effect).toBeNull();
  });

  it('shaving + arrow → progress 1씩 증가 (효과 없음)', () => {
    let state: ShaveStateInternal = { phase: 'shaving', progress: 2 };
    const r = reduceShave(state, { type: 'arrow' });
    expect(r.state.progress).toBe(3);
    expect(r.state.phase).toBe('shaving');
    expect(r.effect).toBeNull();
  });

  it('6번째 arrow → phase=done + shaved 효과', () => {
    let state: ShaveStateInternal = { phase: 'shaving', progress: TOTAL_SHAVE_STEPS - 1 };
    const r = reduceShave(state, { type: 'arrow' });
    expect(r.state.phase).toBe('done');
    expect(r.state.progress).toBe(TOTAL_SHAVE_STEPS);
    expect(r.effect).toBe('shaved');
  });

  it('어느 단계든 quit → abort 효과 (state 무변경)', () => {
    const introQuit = reduceShave(INITIAL_SHAVE_STATE, { type: 'quit' });
    expect(introQuit.effect).toBe('abort');
    expect(introQuit.state).toEqual(INITIAL_SHAVE_STATE);

    const shavingQuit = reduceShave({ phase: 'shaving', progress: 3 }, { type: 'quit' });
    expect(shavingQuit.effect).toBe('abort');
    expect(shavingQuit.state).toEqual({ phase: 'shaving', progress: 3 });
  });

  it('done 단계에서 q 외 모든 입력 무시 (재진입 차단)', () => {
    const state: ShaveStateInternal = { phase: 'done', progress: TOTAL_SHAVE_STEPS };
    const r1 = reduceShave(state, { type: 'arrow' });
    expect(r1).toEqual({ state, effect: null });
    const r2 = reduceShave(state, { type: 'any-key' });
    expect(r2).toEqual({ state, effect: null });
  });
});

describe('requiredKeyCount (단계별 키 입력 횟수)', () => {
  it('smooth/stubble/bushy → 6회', () => {
    expect(requiredKeyCount('smooth')).toBe(6);
    expect(requiredKeyCount('stubble')).toBe(6);
    expect(requiredKeyCount('bushy')).toBe(6);
  });
  it('rugged → 8회', () => {
    expect(requiredKeyCount('rugged')).toBe(8);
  });
  it('hermit → 10회', () => {
    expect(requiredKeyCount('hermit')).toBe(10);
  });
});

describe('reduceShave 가변 키 횟수', () => {
  it('rugged(8회): 8번째 arrow에 done', () => {
    let s: ShaveStateInternal = { phase: 'shaving', progress: 6 };
    let r = reduceShave(s, { type: 'arrow' }, 8);
    expect(r.state.phase).toBe('shaving'); // 7
    expect(r.effect).toBeNull();
    r = reduceShave(r.state, { type: 'arrow' }, 8);
    expect(r.state.phase).toBe('done'); // 8
    expect(r.effect).toBe('shaved');
  });

  it('hermit(10회): 9번째까진 shaving, 10번째 done', () => {
    let s: ShaveStateInternal = { phase: 'shaving', progress: 8 };
    let r = reduceShave(s, { type: 'arrow' }, 10);
    expect(r.state.phase).toBe('shaving'); // 9
    r = reduceShave(r.state, { type: 'arrow' }, 10);
    expect(r.state.phase).toBe('done'); // 10
    expect(r.effect).toBe('shaved');
  });
});

describe('shavedBeard (면도 진행 중 수염, v0.1.3 비율)', () => {
  it('시작(progress 0)은 교정된 수염 그대로', () => {
    // hermit 수염 \MWM/ → 3자 코어
    expect(shavedBeard('\\MWM/', 0, 10)).toBe('\\MWM/');
  });

  it('옛날 긴 수염(W 10칸)을 만들지 않는다', () => {
    const mid = shavedBeard('\\WWW/', 5, 10);
    // 코어는 항상 3자(공백+남은 수염), 전체 5자 — 절대 10칸 아님
    expect(mid.length).toBe(5);
    expect(mid).not.toContain('WWWWWWWWWW');
  });

  it('진행할수록 왼쪽부터 깎여 공백', () => {
    // 3자 코어, ratio=progress/required
    expect(shavedBeard('\\MWM/', 4, 10)).toBe('\\ WM/'); // floor(3*0.4)=1 깎임
    expect(shavedBeard('\\MWM/', 7, 10)).toBe('\\  M/'); // floor(3*0.7)=2 깎임
  });

  it('완료(progress=required)면 전부 공백', () => {
    expect(shavedBeard('\\MWM/', 10, 10)).toBe('\\   /');
  });

  it('형식이 다른 입력은 안전하게 그대로', () => {
    expect(shavedBeard('weird', 1, 6)).toBe('weird');
  });
});
