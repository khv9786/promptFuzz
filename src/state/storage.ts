import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { PromptFuzzState } from '../types/index.js';
import { isValidProfileId, DEFAULT_PROFILE } from './profiles.js';

export const PROMPTFUZZ_DIR = join(homedir(), '.promptfuzz');
export const STATE_FILE = join(PROMPTFUZZ_DIR, 'state.json');

const CURRENT_VERSION = '1.0';

function createInitialState(): PromptFuzzState {
  return {
    version: CURRENT_VERSION,
    installedAt: new Date().toISOString(),
    cumulativeTokens: 0,
    lastJsonlOffset: {},
    currentStage: 'smooth',
    shaveHistory: [],
    stretchCardsShown: [],
    onboardingShaveDone: false,
    thresholdProfile: DEFAULT_PROFILE,
    dailyLog: {},
  };
}

export async function ensureDir(): Promise<void> {
  if (!existsSync(PROMPTFUZZ_DIR)) {
    await mkdir(PROMPTFUZZ_DIR, { recursive: true, mode: 0o700 });
  }
}

export async function loadState(): Promise<PromptFuzzState> {
  await ensureDir();
  if (!existsSync(STATE_FILE)) {
    const initial = createInitialState();
    await saveState(initial);
    return initial;
  }

  try {
    const raw = await readFile(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as PromptFuzzState;
    return migrate(parsed);
  } catch {
    const initial = createInitialState();
    await saveState(initial);
    return initial;
  }
}

export async function saveState(state: PromptFuzzState): Promise<void> {
  await ensureDir();
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), { mode: 0o600 });
  try {
    await chmod(STATE_FILE, 0o600);
  } catch {
    // 일부 환경(Windows 등)에선 무시
  }
}

function migrate(state: PromptFuzzState): PromptFuzzState {
  const defaults = createInitialState();
  const merged: PromptFuzzState = {
    ...defaults,
    ...state,
    version: CURRENT_VERSION,
    onboardingShaveDone: state.onboardingShaveDone ?? false,
  };

  // 손상되거나 수동 편집된 state.json 방어 — nullish 병합만으로는
  // 잘못된 문자열/타입을 못 막으므로 명시적 타입 가드.
  if (!isValidProfileId(merged.thresholdProfile)) {
    merged.thresholdProfile = DEFAULT_PROFILE;
  }
  if (typeof merged.dailyLog !== 'object' || merged.dailyLog === null) {
    merged.dailyLog = {};
  }

  return merged;
}
