import chalk from 'chalk';
import { loadState, saveState } from '../state/storage.js';
import { stageFromTokens } from '../state/stages.js';
import { PROFILES, getProfile, isValidProfileId } from '../state/profiles.js';
import type { ProfileId } from '../types/index.js';

const NUMERAL = ['①', '②', '③', '④', '⑤'] as const;

export interface ConfigOptions {
  threshold?: string | boolean;
}

export async function configCommand(opts: ConfigOptions = {}): Promise<void> {
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

async function printCurrent(): Promise<void> {
  const state = await loadState();
  const profile = getProfile(state.thresholdProfile);
  const t = profile.thresholds;

  const lines: string[] = [];
  lines.push(chalk.bold('🎚 PromptFuzz 설정'));
  lines.push('');
  lines.push(chalk.dim('현재 프로필: ') + chalk.cyan.bold(profile.id) + chalk.dim(` (${profile.nameKr})`));
  lines.push(chalk.dim('설명: ') + profile.description);
  lines.push('');
  lines.push(chalk.dim('임계치:'));
  lines.push(`  ${NUMERAL[0]} 매끈      ` + fmtRange(0, t.stubble));
  lines.push(`  ${NUMERAL[1]} 까끌까끌  ` + fmtRange(t.stubble, t.bushy));
  lines.push(`  ${NUMERAL[2]} 북슬북슬  ` + fmtRange(t.bushy, t.rugged));
  lines.push(`  ${NUMERAL[3]} 따갑따갑  ` + fmtRange(t.rugged, t.hermit));
  lines.push(`  ${NUMERAL[4]} 고슴도치  ` + chalk.bold(t.hermit.toLocaleString()) + '+');
  lines.push('');
  lines.push(chalk.dim('다른 프로필: ') + chalk.cyan('promptfuzz config --threshold {light|medium|heavy}'));

  console.log(lines.join('\n'));
}

async function changeProfile(raw: string): Promise<void> {
  const id = raw.trim().toLowerCase();
  if (!isValidProfileId(id)) {
    console.error(chalk.red(`알 수 없는 프로필: '${raw}'`));
    console.error(chalk.dim('사용 가능: light | medium | heavy'));
    process.exitCode = 1;
    return;
  }

  const state = await loadState();
  const profile = getProfile(id as ProfileId);
  const stage = stageFromTokens(state.cumulativeTokens, profile);
  await saveState({ ...state, thresholdProfile: id as ProfileId, currentStage: stage.id });

  console.log(chalk.green(`✓ 프로필을 '${id}'로 변경했습니다.`));
  console.log(
    chalk.dim(`현재 누적 토큰(${state.cumulativeTokens.toLocaleString()})으로 단계를 재계산합니다... `) +
      chalk.bold(stage.nameKr)
  );
}

function printProfileChoices(): void {
  const lines: string[] = [];
  lines.push(chalk.bold('🎚 사용 가능한 프로필'));
  lines.push('');
  for (const p of Object.values(PROFILES)) {
    lines.push(chalk.cyan.bold(p.id) + chalk.dim(` — ${p.nameKr}`));
    lines.push('  ' + chalk.dim(p.description));
  }
  lines.push('');
  lines.push(chalk.dim('변경: ') + chalk.cyan('promptfuzz config --threshold <id>'));
  console.log(lines.join('\n'));
}

function fmtRange(from: number, to: number): string {
  return chalk.bold(from.toLocaleString()) + chalk.dim(' ~ ') + chalk.bold(to.toLocaleString());
}
