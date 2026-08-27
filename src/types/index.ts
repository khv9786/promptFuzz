export type BeardStage = 'smooth' | 'stubble' | 'bushy' | 'rugged' | 'hermit';

/** 임계치 프로필 ID. 상세 정의는 src/state/profiles.ts. */
export type ProfileId = 'light' | 'medium' | 'heavy' | 'extreme';

export interface StageInfo {
  id: BeardStage;
  nameKr: string;
  color: 'green' | 'yellow' | 'red';
  beardArt: string; // 당신(아빠) 수염 — 단계별, 순수 ASCII, 턱 폭(\xxx/)에 맞춤
  devFace: string; // 당신(아빠) 표정 — 단계별 피로도 (여유 → 코믹 지침), 순수 ASCII
  buddyFace: string;
  interaction: string;
  messages: string[]; // [0] = 기존 동결 멘트, 나머지는 랜덤 후보
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

/** 현재 hook 세션(session_id)의 누적 토큰. offset은 transcriptPath 증분 파싱용. */
export interface SessionUsage {
  id: string;
  transcriptPath: string;
  tokens: number;
  offset: number;
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
  currentSession: SessionUsage | null;
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
