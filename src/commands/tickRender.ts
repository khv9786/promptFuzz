import type { BeardStage, StageInfo } from '../types/index.js';
import { STAGES } from '../state/stages.js';

const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;
const HEADER_EMOJI: Record<BeardStage, string> = {
  smooth: '🌱',
  stubble: '🌱',
  bushy: '🌿',
  rugged: '🌳',
  hermit: '🌲',
};

export function stageLabel(id: BeardStage): string {
  const idx = STAGES.findIndex((s) => s.id === id);
  const info = STAGES[idx];
  if (!info) return id;
  return `${NUMERAL[idx] ?? ''} ${info.nameKr}`;
}

export interface RenderInput {
  stage: StageInfo;
  previousStage: BeardStage;
  compact: boolean;
  /** 표시할 멘트. 미지정 시 동결 멘트(messages[0]) — 렌더를 순수/결정적으로 유지. */
  message?: string;
}

/**
 * 단계 변화 알림의 *순수 텍스트 줄 배열*을 만든다 (색상 없음).
 * 색칠은 tickCommand가 담당. 테스트는 이 텍스트로 검증.
 * 랜덤 멘트는 호출자(tick)가 골라 message로 주입 → 이 함수는 순수.
 */
export function renderStageChange({ stage, previousStage, compact, message }: RenderInput): string[] {
  const from = stageLabel(previousStage);
  const to = stageLabel(stage.id);
  const emoji = HEADER_EMOJI[stage.id];
  const msg = message ?? stage.messages[0] ?? '';

  if (compact) {
    // 1줄: 🌳 ① 매끈 → ④ 따갑따갑: "멘트" → promptfuzz shave
    const hint = stage.id !== 'stubble' ? ' → promptfuzz shave' : '';
    return [`${emoji} ${from} → ${to}: "${msg}"${hint}`];
  }

  const rule = '━'.repeat(50);
  const lines = [
    '',
    rule,
    `${emoji} 수염이 자랐어요  ${from} → ${to}`,
    rule,
    '',
    `    ${stage.buddyFace}  "${msg}"`,
  ];
  if (stage.id !== 'stubble') {
    lines.push('');
    lines.push('💡 promptfuzz shave 로 면도 + 스트레칭');
  }
  return lines;
}
