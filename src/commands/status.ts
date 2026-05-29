import chalk from 'chalk';
import { getCurrentState, incrementStatusView } from '../state/index.js';
import { isInstalled } from '../hooks/manager.js';
import { tick } from '../state/index.js';
import { getStage, STAGE_ORDER } from '../state/stages.js';
import { stagePaint } from '../ui/theme.js';
import { computeWeeklySummary, trendArrow } from '../state/weeklySummary.js';
import { educationHint } from '../ui/educationHint.js';

const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;

function numeralFor(id: string): string {
  const i = STAGE_ORDER.indexOf(id as never);
  return NUMERAL[i] ?? '';
}

export interface StatusOptions {
  json?: boolean;
}

export async function statusCommand(opts: StatusOptions = {}): Promise<void> {
  await tick();

  const { state, stage } = await getCurrentState();
  const installed = await isInstalled();

  // --json: 부수효과 없음 (count 증가 X, 교육 멘트 X).
  if (opts.json) {
    const summary = computeWeeklySummary(state.dailyLog);
    console.log(
      JSON.stringify(
        {
          cumulativeTokens: state.cumulativeTokens,
          stage: stage.id,
          stageNameKr: stage.nameKr,
          profile: state.thresholdProfile,
          shaveCount: state.shaveHistory.length,
          hookInstalled: installed,
          weekly: summary,
        },
        null,
        2,
      ),
    );
    return;
  }

  const colorFn = stagePaint(chalk, stage.id);

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
      colorFn(`${numeralFor(stage.id)} ${stage.nameKr}`) +
      chalk.dim('  ·  면도 이력: ') +
      chalk.bold(state.shaveHistory.length.toString())
  );
  lines.push(
    '  ' + chalk.dim('프로필: ') + chalk.bold(state.thresholdProfile) +
      chalk.dim('  ·  promptfuzz config 로 변경')
  );

  const summary = computeWeeklySummary(state.dailyLog);
  if (summary) {
    const avg = getStage(summary.avgStage);
    const parts = [
      chalk.dim('최근 7일: ') +
        chalk.dim('평균 ') + chalk.bold(`${numeralFor(summary.avgStage)} ${avg.nameKr}`) +
        chalk.dim(' · 면도 ') + chalk.bold(`${summary.shaveCount}회`),
    ];
    if (summary.trend) {
      parts.push(chalk.dim(' · 추세 ') + chalk.bold(trendArrow(summary.trend)));
    }
    lines.push('  ' + parts.join(''));
  }

  lines.push('');

  if (!installed) {
    lines.push('  ' + chalk.yellow('⚠ ') + chalk.dim('Hook이 설치되지 않았어요. ') + chalk.cyan('promptfuzz install'));
  } else if (stage.id === 'bushy' || stage.id === 'rugged' || stage.id === 'hermit') {
    lines.push('  ' + chalk.dim("💡 " + chalk.cyan('promptfuzz shave') + ' 로 면도 + 스트레칭'));
  }

  // 첫 5회 교육 멘트 (count 증가는 사람용 출력에서만).
  const viewCount = await incrementStatusView();
  const hint = educationHint(viewCount);
  if (hint) {
    lines.push('  ' + chalk.dim(hint));
  }

  console.log(lines.join('\n'));
}

function pad(s: string, len: number): string {
  if (s.length >= len) return s;
  return s + ' '.repeat(len - s.length);
}
