import { getCurrentState, incrementStatusView } from '../state/index.js';
import { isInstalled } from '../hooks/manager.js';
import { tick } from '../state/index.js';
import { getStage, STAGE_ORDER, randomMessage } from '../state/stages.js';
import { stageColor, theme } from '../ui/theme.js';
import { computeWeeklySummary, trendArrow } from '../state/weeklySummary.js';
import { educationHint } from '../ui/educationHint.js';
import { formatStatusLine } from './statusLine.js';
import { timeOfDayGreeting } from '../ui/greeting.js';
import { renderDuo } from '../ui/duo.js';

const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;

function numeralFor(id: string): string {
  const i = STAGE_ORDER.indexOf(id as never);
  return NUMERAL[i] ?? '';
}

/** COLUMNS 환경변수를 양의 정수로 파싱. 없음/NaN/0 → undefined (풀버전 fallback). */
function parseColumns(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** statusline용 한 줄 출력. 평문(ANSI 없음), tick 미호출(순수 읽기). */
async function renderLine(): Promise<void> {
  const { state, stage } = await getCurrentState();
  // Claude Code v2.1.153+가 COLUMNS로 상태바 폭을 알려준다. 그 폭에 맞춰 적응.
  const columns = parseColumns(process.env.COLUMNS);
  console.log(formatStatusLine(state.cumulativeTokens, stage, columns));
}

export interface StatusOptions {
  json?: boolean;
  line?: boolean;
}

export async function statusCommand(opts: StatusOptions = {}): Promise<void> {
  // --line: Claude Code 상태바(statusLine)용 경량 한 줄 출력.
  // tick()을 호출하지 않음 → JSONL 스캔/상태 변경 없는 순수 읽기.
  // (Stop hook이 이미 state를 최신으로 유지하므로 상태바는 읽기만 하면 됨.)
  if (opts.line) {
    await renderLine();
    return;
  }

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

  const colorFn = stageColor(stage.id);

  const lines: string[] = [];
  lines.push(theme.bold('  PromptFuzz ─ 오늘의 수염'));
  const greeting = timeOfDayGreeting(new Date().getHours());
  if (greeting) lines.push('  ' + theme.dim(greeting));
  lines.push('');
  // 당신(고정) ↔ Claude(단계별로 멀어짐 + 고개 돌림). renderDuo가 평문 4줄을 만들고
  // 여기서 단계 색을 입힌다.
  for (const row of renderDuo(stage)) {
    lines.push('  ' + colorFn(row));
  }
  lines.push('');
  lines.push('  ' + colorFn(`"${randomMessage(stage)}"`));
  lines.push('');
  lines.push(
    '  ' +
      theme.dim('누적: ') +
      theme.bold(state.cumulativeTokens.toLocaleString()) +
      theme.dim(' 토큰  ·  단계: ') +
      colorFn(`${numeralFor(stage.id)} ${stage.nameKr}`) +
      theme.dim('  ·  면도 이력: ') +
      theme.bold(state.shaveHistory.length.toString())
  );
  lines.push(
    '  ' + theme.dim('프로필: ') + theme.bold(state.thresholdProfile) +
      theme.dim('  ·  promptfuzz config 로 변경')
  );

  const summary = computeWeeklySummary(state.dailyLog);
  if (summary) {
    const avg = getStage(summary.avgStage);
    const parts = [
      theme.dim('최근 7일: ') +
        theme.dim('평균 ') + theme.bold(`${numeralFor(summary.avgStage)} ${avg.nameKr}`) +
        theme.dim(' · 면도 ') + theme.bold(`${summary.shaveCount}회`),
    ];
    if (summary.trend) {
      parts.push(theme.dim(' · 추세 ') + theme.bold(trendArrow(summary.trend)));
    }
    lines.push('  ' + parts.join(''));
  }

  lines.push('');

  if (!installed) {
    lines.push('  ' + theme.warning('⚠ ') + theme.dim('Hook이 설치되지 않았어요. ') + theme.info('promptfuzz install'));
  } else if (stage.id === 'bushy' || stage.id === 'rugged' || stage.id === 'hermit') {
    lines.push('  ' + theme.dim("💡 " + theme.info('promptfuzz shave') + ' 로 면도 + 스트레칭'));
  }

  // 첫 5회 교육 멘트 (count 증가는 사람용 출력에서만).
  const viewCount = await incrementStatusView();
  const hint = educationHint(viewCount);
  if (hint) {
    lines.push('  ' + theme.dim(hint));
  }

  console.log(lines.join('\n'));
}
