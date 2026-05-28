import chalk from 'chalk';
import { tick } from '../state/index.js';

/**
 * Hook이 호출하는 명령. 100ms 이내 종료 목표.
 * 단계가 올라간 경우에만 메시지 출력 (소음 최소화).
 */
export async function tickCommand(): Promise<void> {
  try {
    const result = await tick();
    if (result.stageChanged && result.stage.id !== 'smooth') {
      const colorFn = result.stage.color === 'green'
        ? chalk.green
        : result.stage.color === 'yellow'
          ? chalk.yellow
          : chalk.red;
      console.log();
      console.log(colorFn(`[PromptFuzz] 수염이 자랐어요 → ${result.stage.nameKr}`));
      console.log(chalk.dim(`            ${result.stage.message}`));
      if (result.stage.id !== 'stubble') {
        console.log(chalk.dim('            promptfuzz shave 로 면도하세요.'));
      }
    }
  } catch {
    // tick은 절대 사용자 작업을 막지 않아야 함. 조용히 실패.
    process.exitCode = 0;
  }
}
