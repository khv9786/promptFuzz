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

// 실제 git 의존 없이 결정론적으로 테스트하기 위해 목킹.
const gitHoisted = vi.hoisted(() => ({ label: null as string | null }));
vi.mock('../src/state/git.js', () => ({
  getGitBranchLabel: vi.fn(() => gitHoisted.label),
}));

// 목킹 선언 후 import
import { formatCompactTokens, formatStatusLine } from '../src/commands/statusLine.js';
import { getStage } from '../src/state/stages.js';
import { getLocalDateString } from '../src/state/dailyLog.js';
import { statusCommand } from '../src/commands/status.js';
import * as storage from '../src/state/storage.js';
import * as parser from '../src/parser/index.js';
import { getGitBranchLabel } from '../src/state/git.js';

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
  it('PromptFuzz 이름이 맨 앞에 표시된다', () => {
    expect(formatStatusLine(0, getStage('smooth')).startsWith('PromptFuzz ')).toBe(true);
    expect(formatStatusLine(6_500_000, getStage('hermit'))).toContain('PromptFuzz');
  });
  it('① 매끈 — 수염 글리프 포함, 면도 힌트 없음', () => {
    const s = getStage('smooth');
    expect(formatStatusLine(0, s)).toBe(`PromptFuzz 🧔 ${s.beardArt} ① 매끈 · 0`);
  });
  it('② 까끌까끌 — 면도 힌트 없음', () => {
    const s = getStage('stubble');
    const line = formatStatusLine(175_000, s);
    expect(line).toBe(`PromptFuzz 🧔 ${s.beardArt} ② 까끌까끌 · 175K`);
    expect(line).not.toContain('🪒');
  });
  it('③ 북슬북슬 — 면도 힌트 있음', () => {
    const s = getStage('bushy');
    expect(formatStatusLine(900_000, s)).toBe(`PromptFuzz 🧔 ${s.beardArt} ③ 북슬북슬 · 900K · 🪒 shave`);
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

describe('formatStatusLine 반응형 (COLUMNS 적응)', () => {
  const TOK = 28_800_000; // → 28.8M (실측: 풀 52 / 중간 35 / 축약 26칸)
  const hermit = getStage('hermit');
  const line = (cols?: number) => formatStatusLine(TOK, hermit, cols);

  it('넓으면 풀버전 (이름 + shave 텍스트)', () => {
    expect(line(80)).toContain('PromptFuzz');
    expect(line(80)).toContain('🪒 shave');
  });

  it('폭 경계 52 → 풀, 51 → 중간', () => {
    expect(line(52)).toContain('PromptFuzz');
    expect(line(51)).not.toContain('PromptFuzz'); // 이름 먼저 생략
    expect(line(51)).toContain('고슴도치'); // 단계명은 유지
  });

  it('⭐ 48칸 → 중간버전 (이름 없이 단계명 + 🪒, 잘림 없음)', () => {
    const s = line(48);
    expect(s).not.toContain('PromptFuzz');
    expect(s).toContain('⑤ 고슴도치');
    expect(s).toContain('🪒');
    expect(s).not.toContain('…');
  });

  it('중간 경계 40·35 → 중간, 34 → 축약(단계명 생략)', () => {
    expect(line(40)).toContain('고슴도치');
    expect(line(35)).toContain('고슴도치');
    expect(line(34)).not.toContain('고슴도치'); // 단계명 생략
    expect(line(34)).toContain('⑤'); // 단계 숫자는 유지 (정체성)
  });

  it('아주 좁아도 축약버전 — 글리프 + 단계 + 🪒 보존', () => {
    const s = line(30);
    expect(s).toContain(hermit.beardArt);
    expect(s).toContain('⑤');
    expect(s).toContain('🪒');
  });

  it('COLUMNS 없음/NaN/0 → 풀버전 fallback', () => {
    expect(line(undefined)).toContain('PromptFuzz');
    expect(line(NaN)).toContain('PromptFuzz');
    expect(line(0)).toContain('PromptFuzz');
  });

  it('모든 폭에서 🪒(면도 신호)는 유지된다', () => {
    for (const c of [80, 52, 51, 48, 40, 35, 34, 30, 10, undefined]) {
      expect(line(c)).toContain('🪒');
    }
  });

  it('면도 신호 없는 단계(② 까끌까끌)는 좁아도 🪒 안 생김', () => {
    expect(formatStatusLine(175_000, getStage('stubble'), 20)).not.toContain('🪒');
  });
});

describe('formatStatusLine — gitBranch', () => {
  it('gitBranch가 있으면 이름 뒤에 [branch]로 붙는다 (풀버전)', () => {
    const line = formatStatusLine(0, getStage('smooth'), undefined, 'main');
    expect(line.startsWith('PromptFuzz[main] ')).toBe(true);
  });

  it('gitBranch가 없으면 기존과 동일 (이름에 대괄호 없음)', () => {
    const line = formatStatusLine(0, getStage('smooth'), undefined, null);
    expect(line.startsWith('PromptFuzz ')).toBe(true);
    expect(line).not.toContain('[');
  });

  it('gitBranch 인자를 아예 안 주면 기존과 100% 동일', () => {
    expect(formatStatusLine(0, getStage('smooth'))).toBe(formatStatusLine(0, getStage('smooth'), undefined, undefined));
  });

  it('폭이 좁아 이름이 생략되는 버전에서는 브랜치도 함께 생략된다', () => {
    const TOK = 28_800_000;
    const line = formatStatusLine(TOK, getStage('hermit'), 48, 'main');
    expect(line).not.toContain('PromptFuzz');
    expect(line).not.toContain('[main]');
  });
});

describe('formatStatusLine — 오늘/세션 토큰', () => {
  it('todayTokens를 주면 "오늘 N"이 붙는다', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, 120_000);
    expect(line).toContain('오늘 120K');
  });

  it('sessionTokens를 주면 "세션 N"이 붙는다', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, undefined, 45_000);
    expect(line).toContain('세션 45K');
  });

  it('오늘이 세션보다 앞에 온다', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, 120_000, 45_000);
    expect(line.indexOf('오늘')).toBeLessThan(line.indexOf('세션'));
  });

  it('todayTokens가 0이면 노이즈이므로 생략', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, 0, 45_000);
    expect(line).not.toContain('오늘');
    expect(line).toContain('세션 45K');
  });

  it('sessionTokens가 null이면 생략', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, 120_000, null);
    expect(line).toContain('오늘 120K');
    expect(line).not.toContain('세션');
  });

  it('둘 다 안 주면 기존과 100% 동일', () => {
    const stage = getStage('bushy');
    expect(formatStatusLine(900_000, stage)).toBe(
      formatStatusLine(900_000, stage, undefined, undefined, undefined, undefined)
    );
  });

  // 실측: 최상(오늘+세션) 77 / 상(오늘만) 65 / 풀(기존) 52칸.
  it('폭 경계 77 → 최상, 76 → 세션 생략(상)', () => {
    const TOK = 28_800_000;
    const hermit = getStage('hermit');
    const line = (cols?: number) => formatStatusLine(TOK, hermit, cols, undefined, 120_000, 45_000);

    expect(line(77)).toContain('세션');
    expect(line(76)).not.toContain('세션');
    expect(line(76)).toContain('오늘');
  });

  it('폭 경계 65 → 상(오늘만), 64 → 오늘도 생략(풀)', () => {
    const TOK = 28_800_000;
    const hermit = getStage('hermit');
    const line = (cols?: number) => formatStatusLine(TOK, hermit, cols, undefined, 120_000, 45_000);

    expect(line(65)).toContain('오늘');
    expect(line(64)).not.toContain('오늘');
    expect(line(64)).toContain('PromptFuzz'); // 기존 풀버전으로 강등
  });

  it('COLUMNS 없음 → 가장 풍부한(오늘+세션 포함) 버전', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, 120_000, 45_000);
    expect(line).toContain('오늘');
    expect(line).toContain('세션');
  });
});

describe('formatStatusLine — 컨텍스트 잔여율', () => {
  it('contextRemainingPercent를 주면 "컨텍스트 N%"이 붙는다', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, undefined, undefined, 65);
    expect(line).toContain('컨텍스트 65%');
  });

  it('소수점은 반올림한다', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, undefined, undefined, 64.6);
    expect(line).toContain('컨텍스트 65%');
  });

  it('null이면 생략', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, undefined, undefined, null);
    expect(line).not.toContain('컨텍스트');
  });

  it('오늘/세션 뒤, shave 힌트 앞에 온다', () => {
    const line = formatStatusLine(900_000, getStage('bushy'), undefined, undefined, 120_000, 45_000, 65);
    expect(line.indexOf('세션')).toBeLessThan(line.indexOf('컨텍스트'));
    expect(line.indexOf('컨텍스트')).toBeLessThan(line.indexOf('🪒'));
  });

  it('안 주면 기존과 100% 동일', () => {
    const stage = getStage('bushy');
    expect(formatStatusLine(900_000, stage, undefined, undefined, 120_000, 45_000)).toBe(
      formatStatusLine(900_000, stage, undefined, undefined, 120_000, 45_000, undefined)
    );
  });

  // 실측: 최상(오늘+세션+컨텍스트) 93 / 세션생략 81 / 오늘도생략(컨텍스트만) 68 / 풀(기존) 52칸.
  it('폭이 좁아져도 오늘/세션보다 컨텍스트가 나중까지 남는다', () => {
    const TOK = 28_800_000;
    const hermit = getStage('hermit');
    const line = (cols?: number) => formatStatusLine(TOK, hermit, cols, undefined, 120_000, 45_000, 65);

    expect(line(93)).toContain('세션');
    expect(line(93)).toContain('컨텍스트');

    expect(line(81)).not.toContain('세션');
    expect(line(81)).toContain('오늘');
    expect(line(81)).toContain('컨텍스트');

    expect(line(68)).not.toContain('오늘');
    expect(line(68)).toContain('컨텍스트');

    expect(line(67)).not.toContain('컨텍스트');
    expect(line(67)).toContain('PromptFuzz'); // 기존 풀버전으로 강등
  });
});

describe('statusCommand({ line: true }) — 순수 읽기', () => {
  let logs: string[];
  let spy: ReturnType<typeof vi.spyOn>;
  let origColumns: string | undefined;
  let origIsTTY: boolean | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    logs = [];
    gitHoisted.label = null;
    // COLUMNS 격리: 반응형 출력이 실행 환경(터미널 폭)에 좌우되지 않게 풀버전으로 고정.
    origColumns = process.env.COLUMNS;
    delete process.env.COLUMNS;
    // stdin을 TTY로 고정해 readHookInput이 즉시 null을 반환하게 함
    // (아니면 hook JSON 없는 실제 stdin을 200ms 타임아웃까지 기다림).
    origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });
  });
  afterEach(() => {
    spy.mockRestore();
    if (origColumns !== undefined) process.env.COLUMNS = origColumns;
    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
  });

  it('한 줄만 출력한다', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 3_250_000, currentStage: 'rugged' });
    await statusCommand({ line: true });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain('④ 따갑따갑');
    expect(logs[0]).toContain('🪒 shave');
  });

  it('git 브랜치가 있으면 이름 뒤에 표시된다', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 900_000, currentStage: 'bushy' });
    gitHoisted.label = 'feature-x';
    await statusCommand({ line: true });
    expect(getGitBranchLabel).toHaveBeenCalledWith(process.cwd());
    expect(logs[0]).toContain('PromptFuzz[feature-x]');
  });

  it('git 브랜치가 없으면(non-repo) 기존과 동일', async () => {
    hoisted.state.current = baseState({ cumulativeTokens: 900_000, currentStage: 'bushy' });
    gitHoisted.label = null;
    await statusCommand({ line: true });
    expect(logs[0]).not.toContain('[');
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

  it('오늘 토큰이 있으면 상태바에 반영된다', async () => {
    const today = getLocalDateString(new Date());
    hoisted.state.current = baseState({
      cumulativeTokens: 900_000,
      currentStage: 'bushy',
      dailyLog: { [today]: { date: today, tokensAdded: 120_000, peakStage: 'bushy', shaveCount: 0, stretchCount: 0 } },
    });
    await statusCommand({ line: true });
    expect(logs[0]).toContain('오늘 120K');
  });

  it('currentSession이 있으면 상태바에 반영된다 (stdin 없어도 저장된 값은 읽음)', async () => {
    hoisted.state.current = baseState({
      cumulativeTokens: 900_000,
      currentStage: 'bushy',
      currentSession: { id: 's1', transcriptPath: '/x.jsonl', tokens: 45_000, offset: 100 },
    });
    await statusCommand({ line: true });
    expect(logs[0]).toContain('세션 45K');
  });

  it('stdin이 TTY면 hookInput이 없어 세션을 갱신하지 않는다 (saveState 미호출 유지)', async () => {
    hoisted.state.current = baseState({
      cumulativeTokens: 900_000,
      currentStage: 'bushy',
      currentSession: { id: 's1', transcriptPath: '/x.jsonl', tokens: 45_000, offset: 100 },
    });
    await statusCommand({ line: true });
    expect(storage.saveState).not.toHaveBeenCalled();
  });
});
