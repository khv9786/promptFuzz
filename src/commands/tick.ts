import chalk from 'chalk';
import { tick } from '../state/index.js';
import { STAGES } from '../state/stages.js';
import { stagePaint } from '../ui/theme.js';
import type { BeardStage } from '../types/index.js';

const RULE = '━'.repeat(50);
const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;
const HEADER_EMOJI: Record<BeardStage, string> = {
  smooth: '🌱',
  stubble: '🌱',
  bushy: '🌿',
  rugged: '🌳',
  hermit: '🌲',
};

function stageLabel(id: BeardStage): string {
  const idx = STAGES.findIndex((s) => s.id === id);
  const info = STAGES[idx];
  if (!info) return id;
  return `${NUMERAL[idx] ?? ''} ${info.nameKr}`;
}

/**
 * Hook이 호출하는 명령. 100ms 이내 종료 목표.
 * 단계가 올라간 경우에만 메시지 출력 (소음 최소화).
 * 면도로 인한 매끈 복귀에는 알림 없음.
 */
export async function tickCommand(): Promise<void> {
  try {
    const result = await tick();
    if (!result.stageChanged || result.stage.id === 'smooth') return;

    const colorFn = stagePaint(chalk, result.stage.id);
    const from = stageLabel(result.previousStage);
    const to = stageLabel(result.stage.id);
    const emoji = HEADER_EMOJI[result.stage.id];

    console.log();
    console.log(colorFn(RULE));
    console.log(colorFn(`${emoji} 수염이 자랐어요  ${from} → ${to}`));
    console.log(colorFn(RULE));
    console.log();
    console.log(`    ${colorFn(result.stage.buddyFace)}  "${result.stage.message}"`);

    if (result.stage.id !== 'stubble') {
      console.log();
      console.log(chalk.dim('💡 ') + chalk.cyan('promptfuzz shave') + chalk.dim(' 로 면도 + 스트레칭'));
    }
  } catch {
    // tick은 절대 사용자 작업을 막지 않아야 함. 조용히 실패.
    process.exitCode = 0;
  }
}
