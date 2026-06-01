import chalk from 'chalk';
import type { BeardStage } from '../types/index.js';

/**
 * 의미 기반 컬러 팔레트. chalk 색상 이름을 직접 쓰지 않고
 * 이 상수를 참조해 일관성을 유지한다.
 */
export const COLORS = {
  success: 'green', // 매끈, 완료
  info: 'cyan', // 일반 정보 / 강조 명령어
  warning: 'yellow', // 주의
  danger: 'red', // 경고 / 실패
  critical: 'redBright', // 긴급
  dim: 'gray', // 보조 텍스트
} as const;

export type SemanticColor = keyof typeof COLORS;

/**
 * 의미색 헬퍼. 모든 명령이 `theme.success(text)`처럼 의미로 색을 입힌다.
 * chalk를 직접 들고 있어 호출처에서 chalk를 넘길 필요 없음.
 * (chalk는 ink/react와 무관 — 모든 명령에서 사용 가능.)
 */
export const theme = {
  success: (s: string) => chalk.green(s),
  info: (s: string) => chalk.cyan(s),
  warning: (s: string) => chalk.yellow(s),
  danger: (s: string) => chalk.red(s),
  critical: (s: string) => chalk.redBright(s),
  dim: (s: string) => chalk.dim(s),
  bold: (s: string) => chalk.bold(s),
} as const;

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

/** 단계 ID로 바로 chalk 함수를 얻는 헬퍼. (레거시 — chalk 인스턴스 주입형) */
export function stagePaint(chalkInstance: ChalkLike, stage: BeardStage): (s: string) => string {
  return paint(chalkInstance, STAGE_COLORS[stage]);
}

/**
 * 단계 ID → 의미색 함수 (chalk 주입 불필요).
 * STAGE_COLORS 값이 theme 키(success/info/warning/danger/critical)와 일치하므로 직접 매핑.
 */
export function stageColor(stage: BeardStage): (s: string) => string {
  return theme[STAGE_COLORS[stage]];
}
