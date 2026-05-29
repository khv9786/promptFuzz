import chalk from 'chalk';
import { tick } from '../state/index.js';
import { loadState } from '../state/storage.js';
import { stagePaint } from '../ui/theme.js';
import { isQuietNow } from '../state/quietHours.js';
import { renderStageChange } from './tickRender.js';

/**
 * Hook이 호출하는 명령. 100ms 이내 종료 목표.
 * 단계가 올라간 경우에만 메시지 출력 (소음 최소화).
 * - 면도로 인한 매끈 복귀에는 알림 없음.
 * - quiet hours 범위면 알림 suppress (dailyLog 갱신은 tick()에서 이미 수행).
 * - PROMPTFUZZ_COMPACT=1 이면 1줄 축약.
 */
export async function tickCommand(): Promise<void> {
  try {
    const result = await tick();
    if (!result.stageChanged || result.stage.id === 'smooth') return;

    // quiet hours suppress (상태는 이미 갱신됨, 알림만 침묵).
    const state = await loadState();
    if (isQuietNow(state.quietHours, new Date().getHours())) return;

    const compact = process.env.PROMPTFUZZ_COMPACT === '1';
    const colorFn = stagePaint(chalk, result.stage.id);
    const lines = renderStageChange({
      stage: result.stage,
      previousStage: result.previousStage,
      compact,
    });

    if (compact) {
      // 1줄 전체를 단계 색으로.
      console.log(colorFn(lines[0]!));
    } else {
      // 구분선/헤더는 단계 색, 멘트 줄과 안내는 그대로.
      for (const line of lines) {
        if (line.includes('━') || line.includes('수염이 자랐어요')) {
          console.log(colorFn(line));
        } else {
          console.log(line);
        }
      }
    }
  } catch {
    // tick은 절대 사용자 작업을 막지 않아야 함. 조용히 실패.
    process.exitCode = 0;
  }
}
