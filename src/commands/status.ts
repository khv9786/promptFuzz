import chalk from 'chalk';
import { getCurrentState } from '../state/index.js';
import { isInstalled } from '../hooks/manager.js';
import { tick } from '../state/index.js';

export async function statusCommand(): Promise<void> {
  await tick();

  const { state, stage } = await getCurrentState();
  const installed = await isInstalled();

  const colorFn = stage.color === 'green'
    ? chalk.green
    : stage.color === 'yellow'
      ? chalk.yellow
      : chalk.red;

  const dev = ['  .---.', ' ( o o )', `  ${stage.beardArt}`, '   당신'];
  const buddy = ['  .---.', `  ${stage.buddyFace}`, '  \\___/', '  Claude'];

  const lines: string[] = [];
  lines.push(chalk.bold('  PromptFuzz ─ 오늘의 수염'));
  lines.push('');
  for (let i = 0; i < 4; i++) {
    const left = pad(dev[i] ?? '', 18);
    const right = buddy[i] ?? '';
    const mid = i === 1 ? colorFn(`  ${stage.interaction}  `) : '     ';
    lines.push('  ' + colorFn(left) + mid + colorFn(right));
  }
  lines.push('');
  lines.push('  ' + colorFn(`"${stage.message}"`));
  lines.push('');
  lines.push(
    '  ' +
      chalk.dim('누적: ') +
      chalk.bold(state.cumulativeTokens.toLocaleString()) +
      chalk.dim(' 토큰  ·  단계: ') +
      colorFn(stage.nameKr) +
      chalk.dim('  ·  면도 이력: ') +
      chalk.bold(state.shaveHistory.length.toString())
  );
  lines.push(
    '  ' + chalk.dim('프로필: ') + chalk.bold(state.thresholdProfile) +
      chalk.dim('  ·  promptfuzz config 로 변경')
  );
  lines.push('');

  if (!installed) {
    lines.push('  ' + chalk.yellow('⚠ ') + chalk.dim('Hook이 설치되지 않았어요. ') + chalk.cyan('promptfuzz install'));
  } else if (stage.id === 'bushy' || stage.id === 'rugged' || stage.id === 'hermit') {
    lines.push('  ' + chalk.dim("💡 " + chalk.cyan('promptfuzz shave') + ' 로 면도 + 스트레칭'));
  }

  console.log(lines.join('\n'));
}

function pad(s: string, len: number): string {
  if (s.length >= len) return s;
  return s + ' '.repeat(len - s.length);
}
