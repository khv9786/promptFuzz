/**
 * ShaveGame의 키 처리 + 상태 전이를 순수 함수로 추출.
 * Ink useInput과 React useState는 컴포넌트가 합쳐 쓰지만,
 * 핵심 로직은 이 모듈에서 단위 검증한다.
 */

import type { BeardStage } from '../types/index.js';

export type ShavePhase = 'intro' | 'shaving' | 'done';

export interface ShaveStateInternal {
  phase: ShavePhase;
  progress: number;
}

export type ShaveAction =
  | { type: 'any-key' }
  | { type: 'arrow' }
  | { type: 'quit' };

export type ShaveEffect = 'shaved' | 'abort' | null;

export interface ShaveTransition {
  state: ShaveStateInternal;
  effect: ShaveEffect;
}

/** 기본 키 입력 횟수 (③ bushy 기준, 기존 동작 보존). */
export const TOTAL_SHAVE_STEPS = 6;

export const INITIAL_SHAVE_STATE: ShaveStateInternal = { phase: 'intro', progress: 0 };

/**
 * 면도 직전 단계에 따라 필요한 키 입력 횟수.
 * 수염이 길수록 더 진중한 의식 (더 많은 입력).
 */
export function requiredKeyCount(stageBeforeShave: BeardStage): number {
  switch (stageBeforeShave) {
    case 'rugged':
      return 8;
    case 'hermit':
      return 10;
    default:
      // smooth/stubble/bushy 모두 기본 6회.
      return TOTAL_SHAVE_STEPS;
  }
}

/**
 * @param requiredKeys 이 면도에 필요한 총 키 입력 횟수 (requiredKeyCount로 계산).
 */
export function reduceShave(
  state: ShaveStateInternal,
  action: ShaveAction,
  requiredKeys: number = TOTAL_SHAVE_STEPS,
): ShaveTransition {
  if (action.type === 'quit') {
    // 어느 단계에서든 즉시 abort.
    return { state, effect: 'abort' };
  }

  if (state.phase === 'intro') {
    return { state: { phase: 'shaving', progress: 0 }, effect: null };
  }

  if (state.phase === 'shaving' && action.type === 'arrow') {
    const next = state.progress + 1;
    if (next >= requiredKeys) {
      return {
        state: { phase: 'done', progress: requiredKeys },
        effect: 'shaved',
      };
    }
    return {
      state: { phase: 'shaving', progress: next },
      effect: null,
    };
  }

  // 'done' 단계에서 q 외 모든 키 무시. shaving 단계에서 arrow 외 키 무시.
  return { state, effect: null };
}

/**
 * 면도 진행 중 수염 ASCII. 단계의 교정된 beardArt(`\XXX/` 형식)에서
 * 가운데 글자를 진행률에 비례해 왼쪽부터 공백으로 깎는다.
 *
 * @param beardArt 단계 수염 (예: '\\MWM/'). `\` + 코어 + `/` 형식 가정.
 * @param progress 현재까지 키 입력 횟수
 * @param required 이 면도에 필요한 총 횟수
 */
export function shavedBeard(beardArt: string, progress: number, required: number): string {
  // 형식이 예상과 다르면 안전하게 그대로 반환.
  if (beardArt.length < 2 || !beardArt.startsWith('\\') || !beardArt.endsWith('/')) {
    return beardArt;
  }
  const core = beardArt.slice(1, -1);
  const len = core.length;
  const ratio = required > 0 ? Math.min(1, Math.max(0, progress / required)) : 1;
  const shaved = Math.min(len, Math.floor(len * ratio));
  const cleared = ' '.repeat(shaved) + core.slice(shaved);
  return `\\${cleared}/`;
}

// ── 면도 방식 4종 (v0.1.11) ──────────────────────────────────────────────
// 진행 메커닉(progress/done)은 reduceShave를 그대로 재사용하고, 방식별 "한 단계
// 진행 조건"만 다르다. 아래는 그 판정·표시에 쓰는 순수 함수들 (컴포넌트가 타이머·
// 입력과 합쳐 쓴다). 비대화형(hook/CI)은 방식 선택 없이 자동 면도 — shave.ts 참고.

export type ShaveMethod = 'laser' | 'electric' | 'blade' | 'pluck';
export type ShaveDir = 'up' | 'down' | 'left' | 'right';

export interface ShaveMethodInfo {
  id: ShaveMethod;
  emoji: string;
  label: string;
  desc: string;
}

/** 선택 화면 순서 = 난이도 오름차순(쉬움→어려움). */
export const SHAVE_METHODS: ShaveMethodInfo[] = [
  { id: 'laser', emoji: '⚡', label: '레이저', desc: '가만히 있으면 알아서 (5초)' },
  { id: 'electric', emoji: '🔌', label: '전기면도기', desc: '←/→ 키 연타' },
  { id: 'blade', emoji: '🔪', label: '날 면도기', desc: '나오는 방향키 맞추기' },
  { id: 'pluck', emoji: '✋', label: '손으로 뽑기', desc: '빠르게! 1초 안에 입력' },
];

/** 선택 화면 키('1'~'4') → 방식. 그 외엔 null. */
export function methodFromKey(input: string): ShaveMethod | null {
  if (!/^[1-4]$/.test(input)) return null;
  return SHAVE_METHODS[Number(input) - 1]?.id ?? null;
}

/** 면도하다 따끔할 때(날/손) 가벼운 코믹 멘트 — 진행은 안 되고 같은 자리 재시도. */
export const SHAVE_MISS_MESSAGES = ['아 따가워!', '아야!', '쓰읍..', '윽, 살살!', '읏…'];

export function pickMissMessage(rand: () => number = Math.random): string {
  const list = SHAVE_MISS_MESSAGES;
  const i = Math.floor(rand() * list.length);
  return list[Math.min(Math.max(i, 0), list.length - 1)] ?? list[0]!;
}

/** 날 면도기·손으로 뽑기 모두 상하좌우 사방에서 목표를 낸다. */
export const ALL_DIRS: ShaveDir[] = ['up', 'down', 'left', 'right'];

/** 방향 집합에서 무작위 하나 (rand 주입으로 단위 테스트 가능). */
export function randomDir(set: ShaveDir[], rand: () => number = Math.random): ShaveDir {
  const i = Math.floor(rand() * set.length);
  return set[Math.min(Math.max(i, 0), set.length - 1)] ?? set[0]!;
}

/** 누른 방향이 목표와 같으면 'hit', 아니면(틀림/없음) 'miss'. */
export function judgeDirection(target: ShaveDir, pressed: ShaveDir | null): 'hit' | 'miss' {
  return pressed !== null && pressed === target ? 'hit' : 'miss';
}

export interface ArrowKeyLike {
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
}

/** Ink key 객체 → 방향. 방향키가 아니면 null. (순수 — 테스트 가능) */
export function keyToDir(key: ArrowKeyLike): ShaveDir | null {
  if (key.upArrow) return 'up';
  if (key.downArrow) return 'down';
  if (key.leftArrow) return 'left';
  if (key.rightArrow) return 'right';
  return null;
}

export const DIR_GLYPH: Record<ShaveDir, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

/** 손으로 뽑기 제한 시간(ms). Ink 타이머 정확도 고려해 1초. */
export const PLUCK_WINDOW_MS = 1000;
