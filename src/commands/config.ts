import { loadState, saveState } from '../state/storage.js';
import { stageFromTokens } from '../state/stages.js';
import { PROFILES, getProfile, isValidProfileId } from '../state/profiles.js';
import { parseQuietHours, formatQuietHours } from '../state/quietHours.js';
import { theme } from '../ui/theme.js';
import type { ProfileId } from '../types/index.js';

const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;

export interface ConfigOptions {
  threshold?: string | boolean;
  quietHours?: string;
  json?: boolean;
}

export async function configCommand(opts: ConfigOptions = {}): Promise<void> {
  // --json → 현재 프로필 + 임계치를 JSON으로 (부수효과 없음)
  if (opts.json) {
    const state = await loadState();
    const profile = getProfile(state.thresholdProfile);
    console.log(
      JSON.stringify(
        {
          profile: profile.id,
          nameKr: profile.nameKr,
          description: profile.description,
          thresholds: profile.thresholds,
          quietHours: state.quietHours,
        },
        null,
        2,
      ),
    );
    return;
  }

  // --quiet-hours <range|off>
  if (typeof opts.quietHours === 'string') {
    await changeQuietHours(opts.quietHours);
    return;
  }

  // --threshold 값 없이 호출 → 사용 가능한 프로필 안내
  if (opts.threshold === true) {
    printProfileChoices();
    return;
  }

  // --threshold <profile> → 변경
  if (typeof opts.threshold === 'string') {
    await changeProfile(opts.threshold);
    return;
  }

  // 인자 없음 → 현재 설정 표시
  await printCurrent();
}

async function changeQuietHours(raw: string): Promise<void> {
  const parsed = parseQuietHours(raw);
  if (parsed === undefined) {
    console.error(theme.danger(`잘못된 형식: '${raw}'`));
    console.error(theme.dim('예: 23-07 (밤 11시~아침 7시), 해제: off'));
    process.exitCode = 1;
    return;
  }
  const state = await loadState();
  await saveState({ ...state, quietHours: parsed });
  if (parsed === null) {
    console.log(theme.success('✓ 침묵 시간대를 해제했습니다.'));
  } else {
    console.log(theme.success(`✓ 침묵 시간대를 ${formatQuietHours(parsed)}로 설정했습니다.`));
    console.log(theme.dim('  이 시간엔 단계 변화 알림이 조용합니다 (기록은 계속).'));
  }
}

async function printCurrent(): Promise<void> {
  const state = await loadState();
  const profile = getProfile(state.thresholdProfile);
  const t = profile.thresholds;

  const lines: string[] = [];
  lines.push(theme.bold('🎚 PromptFuzz 설정'));
  lines.push('');
  lines.push(theme.dim('현재 프로필: ') + theme.info(theme.bold(profile.id)) + theme.dim(` (${profile.nameKr})`));
  lines.push(theme.dim('설명: ') + profile.description);
  lines.push('');
  lines.push(theme.dim('임계치:'));
  lines.push(`  ${NUMERAL[0]} 매끈      ` + fmtRange(0, t.stubble));
  lines.push(`  ${NUMERAL[1]} 까끌까끌  ` + fmtRange(t.stubble, t.bushy));
  lines.push(`  ${NUMERAL[2]} 북슬북슬  ` + fmtRange(t.bushy, t.rugged));
  lines.push(`  ${NUMERAL[3]} 따갑따갑  ` + fmtRange(t.rugged, t.hermit));
  lines.push(`  ${NUMERAL[4]} 고슴도치  ` + theme.bold(t.hermit.toLocaleString()) + '+');
  lines.push('');
  lines.push(theme.dim('침묵 시간대: ') + theme.bold(formatQuietHours(state.quietHours)));
  lines.push('');
  lines.push(theme.dim('다른 프로필: ') + theme.info('promptfuzz config --threshold {light|medium|heavy|extreme}'));

  console.log(lines.join('\n'));
}

async function changeProfile(raw: string): Promise<void> {
  const id = raw.trim().toLowerCase();
  if (!isValidProfileId(id)) {
    console.error(theme.danger(`알 수 없는 프로필: '${raw}'`));
    console.error(theme.dim('사용 가능: light | medium | heavy | extreme'));
    process.exitCode = 1;
    return;
  }

  const state = await loadState();
  const profile = getProfile(id as ProfileId);
  const stage = stageFromTokens(state.cumulativeTokens, profile);
  await saveState({ ...state, thresholdProfile: id as ProfileId, currentStage: stage.id });

  console.log(theme.success(`✓ 프로필을 '${id}'로 변경했습니다.`));
  console.log(
    theme.dim(`현재 누적 토큰(${state.cumulativeTokens.toLocaleString()})으로 단계를 재계산합니다... `) +
      theme.bold(stage.nameKr)
  );
}

function printProfileChoices(): void {
  const lines: string[] = [];
  lines.push(theme.bold('🎚 사용 가능한 프로필'));
  lines.push('');
  for (const p of Object.values(PROFILES)) {
    lines.push(theme.info(theme.bold(p.id)) + theme.dim(` — ${p.nameKr}`));
    lines.push('  ' + theme.dim(p.description));
  }
  lines.push('');
  lines.push(theme.dim('변경: ') + theme.info('promptfuzz config --threshold <id>'));
  console.log(lines.join('\n'));
}

function fmtRange(from: number, to: number): string {
  return theme.bold(from.toLocaleString()) + theme.dim(' ~ ') + theme.bold(to.toLocaleString());
}
