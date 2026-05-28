export type BeardStage = 'smooth' | 'stubble' | 'bushy' | 'rugged' | 'hermit';

export interface StageInfo {
  id: BeardStage;
  nameKr: string;
  threshold: number;
  color: 'green' | 'yellow' | 'red';
  beardArt: string;
  buddyFace: string;
  interaction: string;
  message: string;
}

export interface ShaveRecord {
  at: string;
  tokensAtShave: number;
}

export interface PromptFuzzState {
  version: string;
  installedAt: string;
  cumulativeTokens: number;
  lastJsonlOffset: Record<string, number>;
  currentStage: BeardStage;
  shaveHistory: ShaveRecord[];
  stretchCardsShown: string[];
}

export interface UsageDelta {
  inputTokens: number;
  outputTokens: number;
  total: number;
}

export interface StretchCard {
  id: string;
  title: string;
  durationSeconds: number;
  steps: string[];
}
