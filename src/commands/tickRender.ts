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
}

/**
 * 단계 변화 알림의 *순수 텍스트 줄 배열*을 만든다 (색상 없음).
 * 색칠은 tickCommand가 담당. 테스트는 이 텍스트로 검증.
 */
export function renderStageChange({ stage, previousStage, compact }: RenderInput): string[] {
  const from = stageLabel(previousStage);
  const to = stageLabel(stage.id);
  const emoji = HEADER_EMOJI[stage.id];

  if (compact) {
    // 1줄: 🌳 ① 매끈 → ④ 따갑따갑: "멘트" → promptfuzz shave
    const hint = stage.id !== 'stubble' ? ' → promptfuzz shave' : '';
    return [`${emoji} ${from} → ${to}: "${stage.message}"${hint}`];
  }

  const rule = '━'.repeat(50);
  const lines = [
    '',
    rule,
    `${emoji} 수염이 자랐어요  ${from} → ${to}`,
    rule,
    '',
    `    ${stage.buddyFace}  "${stage.message}"`,
  ];
  if (stage.id !== 'stubble') {
    lines.push('');
    lines.push('💡 promptfuzz shave 로 면도 + 스트레칭');
  }
  return lines;
}
