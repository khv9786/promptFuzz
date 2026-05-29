import type { BeardStage } from '../types/index.js';

/**
 * 의미 기반 컬러 팔레트. chalk 색상 이름을 직접 쓰지 않고
 * 이 상수를 참조해 일관성을 유지한다.
 */
export const COLORS = {
  success: 'green', // 매끈, 완료
  info: 'cyan', // 일반 정보
  warning: 'yellow', // 경고
  danger: 'red', // 위험
  critical: 'redBright', // 긴급
  dim: 'gray', // 보조 텍스트
} as const;

export type SemanticColor = keyof typeof COLORS;

/** 단계별 의미 색상. */
export const STAGE_COLORS: Record<BeardStage, SemanticColor> = {
  smooth: 'success',
  stubble: 'info',
  bushy: 'warning',
  rugged: 'danger',
  hermit: 'critical',
};

type ChalkLike = {
  green: (s: string) => string;
  cyan: (s: string) => string;
  yellow: (s: string) => string;
  red: (s: string) => string;
  redBright: (s: string) => string;
  gray: (s: string) => string;
};

/**
 * SemanticColor를 chalk 함수로 변환.
 * 호출처는 colorFn(chalk, 'warning')(text) 형태로 사용.
 */
export function paint(chalkInstance: ChalkLike, color: SemanticColor): (s: string) => string {
  const name = COLORS[color];
  return chalkInstance[name];
}

/** 단계 ID로 바로 chalk 함수를 얻는 헬퍼. */
export function stagePaint(chalkInstance: ChalkLike, stage: BeardStage): (s: string) => string {
  return paint(chalkInstance, STAGE_COLORS[stage]);
}
