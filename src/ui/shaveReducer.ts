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
