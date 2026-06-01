import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { BeardStage, PromptFuzzState } from '../types/index.js';
import { isValidProfileId, DEFAULT_PROFILE } from './profiles.js';
import { isValidQuietHours } from './quietHours.js';

const VALID_STAGES: readonly BeardStage[] = ['smooth', 'stubble', 'bushy', 'rugged', 'hermit'];

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
    statusViewCount: 0,
    quietHours: null,
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
  if (typeof merged.statusViewCount !== 'number' || !Number.isFinite(merged.statusViewCount)) {
    merged.statusViewCount = 0;
  }
  if (!isValidQuietHours(merged.quietHours)) {
    merged.quietHours = null;
  }

  // 숫자/배열/단계 필드 가드 — null/문자열/음수로 인한 런타임 크래시 방지.
  // (예: cumulativeTokens가 null이면 .toLocaleString()에서 터짐)
  if (typeof merged.cumulativeTokens !== 'number' || !Number.isFinite(merged.cumulativeTokens) || merged.cumulativeTokens < 0) {
    merged.cumulativeTokens = 0;
  }
  if (!Array.isArray(merged.shaveHistory)) {
    merged.shaveHistory = [];
  }
  if (!Array.isArray(merged.stretchCardsShown)) {
    merged.stretchCardsShown = [];
  }
  if (typeof merged.lastJsonlOffset !== 'object' || merged.lastJsonlOffset === null || Array.isArray(merged.lastJsonlOffset)) {
    merged.lastJsonlOffset = {};
  }
  if (!VALID_STAGES.includes(merged.currentStage)) {
    merged.currentStage = 'smooth';
  }

  return merged;
}
