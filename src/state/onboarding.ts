import { stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';
import { loadState, saveState } from './storage.js';
import { scanAllSessions, CLAUDE_PROJECTS_DIR } from '../parser/index.js';
import { stageFromTokens } from './stages.js';
import { getProfile, isValidProfileId } from './profiles.js';
import type { PromptFuzzState, StageInfo, ProfileId } from '../types/index.js';

const ONBOARDING_THRESHOLD = 50_000; // medium 프로필 ② 임계치와 일치

export type OnboardingChoice = 'shave' | 'keep' | 'skip-silent';

export interface OnboardingDeps {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  isTTY?: boolean;
}

/**
 * 모든 JSONL 파일을 *읽지 않고* 크기만 stat으로 측정해
 * 다음 tick 때부터의 출발점(EOF)을 박는다.
 * 보안 원칙: 본문 접근 금지.
 *
 * @param dir - 스캔 대상 디렉토리. 기본값은 ~/.claude/projects.
 *              테스트에서 임시 디렉토리를 주입할 수 있게 인자로 노출.
 */
export async function skipToEnd(dir: string = CLAUDE_PROJECTS_DIR): Promise<Record<string, number>> {
  if (!existsSync(dir)) return {};
  const files = await findJsonlFiles(dir);
  const offsets: Record<string, number> = {};
  for (const file of files) {
    try {
      offsets[file] = (await stat(file)).size;
    } catch {
      // 권한 등 문제는 조용히 스킵
    }
  }
  return offsets;
}

async function findJsonlFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) out.push(...(await findJsonlFiles(full)));
      else if (e.isFile() && e.name.endsWith('.jsonl')) out.push(full);
    }
  } catch {
    // ignore
  }
  return out;
}

/**
 * install 직후 1회 호출. 이미 완료되었거나, 누적이 ② 미만이면
 * 조용히 'skip-silent' 반환.
 */
export async function runOnboardingShave(
  deps: OnboardingDeps = {}
): Promise<{ choice: OnboardingChoice; tokens: number; stage: StageInfo; profile: ProfileId }> {
  const state = await loadState();
  const profile = getProfile(state.thresholdProfile);

  if (state.onboardingShaveDone) {
    const stage = stageFromTokens(state.cumulativeTokens, profile);
    return { choice: 'skip-silent', tokens: state.cumulativeTokens, stage, profile: state.thresholdProfile };
  }

  const output = deps.output ?? process.stdout;
  const input = deps.input ?? process.stdin;
  const isTTY = deps.isTTY ?? Boolean((process.stdin as NodeJS.ReadStream).isTTY);

  output.write(chalk.dim('  당신의 토큰 히스토리를 확인 중...\n'));

  const { totalDelta, updatedOffsets } = await scanAllSessions(state.lastJsonlOffset);
  const cumulative = state.cumulativeTokens + totalDelta.total;
  const stage = stageFromTokens(cumulative, profile);

  if (cumulative < ONBOARDING_THRESHOLD) {
    const silent: PromptFuzzState = {
      ...state,
      cumulativeTokens: cumulative,
      lastJsonlOffset: updatedOffsets,
      currentStage: stage.id,
      onboardingShaveDone: true,
    };
    await saveState(silent);
    return { choice: 'skip-silent', tokens: cumulative, stage, profile: state.thresholdProfile };
  }

  renderShockScreen(output, cumulative, stage);

  const choice: 'shave' | 'keep' = isTTY ? await promptShaveChoice(input, output) : 'shave';

  // 프로필 선택 — TTY면 묻고, 아니면 기존 값 유지.
  const chosenProfile: ProfileId = isTTY
    ? await promptProfileChoice(input, output, state.thresholdProfile)
    : state.thresholdProfile;

  const base: PromptFuzzState = {
    ...state,
    onboardingShaveDone: true,
    thresholdProfile: chosenProfile,
  };

  if (choice === 'shave') {
    const fresh = await skipToEnd();
    const shaved: PromptFuzzState = {
      ...base,
      cumulativeTokens: 0,
      lastJsonlOffset: fresh,
      currentStage: 'smooth',
    };
    await saveState(shaved);
    output.write('\n' + chalk.green('  🪒 매끈! 새 출발입니다.') + '\n');
    output.write(chalk.dim(`  프로필: ${chosenProfile}\n\n`));
    return { choice: 'shave', tokens: 0, stage: stageFromTokens(0, getProfile(chosenProfile)), profile: chosenProfile };
  }

  const keptStage = stageFromTokens(cumulative, getProfile(chosenProfile));
  const kept: PromptFuzzState = {
    ...base,
    cumulativeTokens: cumulative,
    lastJsonlOffset: updatedOffsets,
    currentStage: keptStage.id,
  };
  await saveState(kept);
  output.write('\n' + chalk.yellow('  🦔 좋아요. 진짜를 직시하세요.') + '\n');
  output.write(chalk.dim(`  프로필: ${chosenProfile}\n\n`));
  return { choice: 'keep', tokens: cumulative, stage: keptStage, profile: chosenProfile };
}

function renderShockScreen(
  output: NodeJS.WritableStream,
  tokens: number,
  stage: StageInfo
): void {
  const colorFn =
    stage.color === 'green'
      ? chalk.green
      : stage.color === 'yellow'
        ? chalk.yellow
        : chalk.red;

  output.write('\n');
  output.write('  ' + chalk.bold('당신의 Claude Code 토큰 히스토리를 발견했어요.') + '\n\n');
  output.write('    ' + colorFn(stage.buddyFace) + '\n');
  output.write('    ' + colorFn(stage.beardArt) + '\n\n');
  output.write(
    '  ' + colorFn(`"아빠... ${tokens.toLocaleString()} 토큰의 수염을 가지고 계셨네요..."`) + '\n\n'
  );
  output.write('  이제부터 새로 시작할까요?\n');
  output.write('    ' + chalk.cyan('[Enter]') + ' 면도하고 시작 ' + chalk.dim('(권장)') + '\n');
  output.write('    ' + chalk.cyan('[s]') + '     이대로 두고 시작 ' + chalk.dim('(현실 직시 모드)') + '\n');
}

async function promptShaveChoice(
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream
): Promise<'shave' | 'keep'> {
  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question('  > ')).trim().toLowerCase();
    return answer === 's' ? 'keep' : 'shave';
  } finally {
    rl.close();
  }
}

async function promptProfileChoice(
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
  fallback: ProfileId
): Promise<ProfileId> {
  output.write('\n');
  output.write('  마지막으로, 사용 패턴을 알려주세요:\n');
  output.write('    ' + chalk.cyan('[1]') + ' 가볍게 — Sonnet 위주, Pro 플랜\n');
  output.write('    ' + chalk.cyan('[2]') + ' 균형 — 평균 (기본, 잘 모르겠으면 이것)\n');
  output.write('    ' + chalk.cyan('[3]') + ' 무겁게 — Opus + Agent Teams, Max 플랜\n');
  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question('  선택 (Enter = 균형 권장): ')).trim();
    if (answer === '1') return 'light';
    if (answer === '3') return 'heavy';
    if (answer === '2' || answer === '') return 'medium';
    return isValidProfileId(fallback) ? fallback : 'medium';
  } finally {
    rl.close();
  }
}
