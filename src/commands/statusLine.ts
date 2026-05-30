import type { StageInfo } from '../types/index.js';
import { stageLabel } from './tickRender.js';

/**
 * 누적 토큰을 상태바용으로 압축한다.
 * 예: 3_250_000 → "3.3M", 175_000 → "175K", 0 → "0".
 */
export function formatCompactTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/**
 * Claude Code 상태바(statusLine)용 한 줄 문자열. 평문(ANSI 색 없음).
 * 예: "🧔 \WWWWW/ ④ 따갑따갑 · 3.2M · 🪒 shave"
 *
 * 단계별 *당신 수염*(stage.beardArt, 순수 ASCII)을 함께 보여 상태를 시각적으로 전달.
 * (distress 이모지 대신 수염을 쓴 이유: 컨셉상 따가워하는 건 Claude이지 아빠가 아니며,
 *  톤 가이드의 "죄책감 금지"와도 맞다 — 수염은 중립적 신호.)
 * 면도 힌트(🪒 shave)는 ③ 북슬북슬 이상에서만 — status 명령의 힌트 조건과 동일.
 * 순수 함수: state를 읽지 않고 인자만으로 결정 → 단위 테스트 가능.
 */
export function formatStatusLine(cumulativeTokens: number, stage: StageInfo): string {
  const parts = [`🧔 ${stage.beardArt} ${stageLabel(stage.id)}`, formatCompactTokens(cumulativeTokens)];
  if (stage.id === 'bushy' || stage.id === 'rugged' || stage.id === 'hermit') {
    parts.push('🪒 shave');
  }
  return parts.join(' · ');
}
