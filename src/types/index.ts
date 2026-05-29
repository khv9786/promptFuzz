export type BeardStage = 'smooth' | 'stubble' | 'bushy' | 'rugged' | 'hermit';

/** 임계치 프로필 ID. 상세 정의는 src/state/profiles.ts. */
export type ProfileId = 'light' | 'medium' | 'heavy' | 'extreme';

export interface StageInfo {
  id: BeardStage;
  nameKr: string;
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

/** 하루치 활동 요약. 시간 단위가 아닌 날짜 단위만 저장. */
export interface DailyEntry {
  date: string; // "YYYY-MM-DD" (로컬 시간)
  tokensAdded: number; // 그 날 추가된 토큰 (면도와 무관)
  peakStage: BeardStage; // 그 날 최고 도달 단계
  shaveCount: number; // 그 날 면도 횟수
  stretchCount: number; // 그 날 완료한 스트레칭 카드
}

export interface PromptFuzzState {
  version: string;
  installedAt: string;
  cumulativeTokens: number;
  lastJsonlOffset: Record<string, number>;
  currentStage: BeardStage;
  shaveHistory: ShaveRecord[];
  stretchCardsShown: string[];
  onboardingShaveDone: boolean;
  thresholdProfile: ProfileId;
  dailyLog: Record<string, DailyEntry>;
  statusViewCount: number;
  quietHours: { start: number; end: number } | null;
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
