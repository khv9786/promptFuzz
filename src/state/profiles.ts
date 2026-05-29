import type { BeardStage } from '../types/index.js';

export type ProfileId = 'light' | 'medium' | 'heavy';

/** smooth는 항상 0이므로 임계치 표에서 제외. */
export type StageWithThreshold = Exclude<BeardStage, 'smooth'>;

export interface ThresholdProfile {
  id: ProfileId;
  nameKr: string;
  description: string;
  thresholds: Record<StageWithThreshold, number>;
}

export const PROFILES: Record<ProfileId, ThresholdProfile> = {
  light: {
    id: 'light',
    nameKr: '가볍게 (Sonnet 위주)',
    description: 'Pro 플랜 + Sonnet 사용자에게 권장',
    thresholds: {
      stubble: 20_000,
      bushy: 100_000,
      rugged: 500_000,
      hermit: 1_500_000,
    },
  },
  medium: {
    id: 'medium',
    nameKr: '균형 (기본)',
    description: '평균적인 사용자 또는 잘 모를 때',
    thresholds: {
      stubble: 50_000,
      bushy: 300_000,
      rugged: 1_500_000,
      hermit: 5_000_000,
    },
  },
  heavy: {
    id: 'heavy',
    nameKr: '무겁게 (Opus + Agents)',
    description: 'Max 플랜 + Opus + Agent Teams 사용자',
    thresholds: {
      stubble: 200_000,
      bushy: 1_000_000,
      rugged: 5_000_000,
      hermit: 15_000_000,
    },
  },
};

export const DEFAULT_PROFILE: ProfileId = 'medium';

export function isValidProfileId(value: unknown): value is ProfileId {
  return value === 'light' || value === 'medium' || value === 'heavy';
}

export function getProfile(id: ProfileId): ThresholdProfile {
  return PROFILES[id] ?? PROFILES[DEFAULT_PROFILE];
}
