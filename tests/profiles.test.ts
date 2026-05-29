import { describe, it, expect } from 'vitest';
import { PROFILES, getProfile, isValidProfileId, DEFAULT_PROFILE } from '../src/state/profiles.js';
import { stageFromTokens } from '../src/state/stages.js';

describe('PROFILES 정의', () => {
  it('3종 프로필이 존재한다', () => {
    expect(Object.keys(PROFILES).sort()).toEqual(['heavy', 'light', 'medium']);
  });

  it('각 프로필 임계치가 단조 증가', () => {
    for (const p of Object.values(PROFILES)) {
      const { stubble, bushy, rugged, hermit } = p.thresholds;
      expect(stubble).toBeLessThan(bushy);
      expect(bushy).toBeLessThan(rugged);
      expect(rugged).toBeLessThan(hermit);
    }
  });

  it('light < medium < heavy (같은 단계 임계치 비교)', () => {
    expect(PROFILES.light.thresholds.hermit).toBeLessThan(PROFILES.medium.thresholds.hermit);
    expect(PROFILES.medium.thresholds.hermit).toBeLessThan(PROFILES.heavy.thresholds.hermit);
  });

  it('기본 프로필은 medium', () => {
    expect(DEFAULT_PROFILE).toBe('medium');
  });
});

describe('isValidProfileId', () => {
  it('유효한 ID만 true', () => {
    expect(isValidProfileId('light')).toBe(true);
    expect(isValidProfileId('medium')).toBe(true);
    expect(isValidProfileId('heavy')).toBe(true);
  });

  it('잘못된 값은 false', () => {
    expect(isValidProfileId('xlarge')).toBe(false);
    expect(isValidProfileId('')).toBe(false);
    expect(isValidProfileId(null)).toBe(false);
    expect(isValidProfileId(42)).toBe(false);
  });
});

describe('getProfile 폴백', () => {
  it('알 수 없는 값이 들어와도 기본 프로필 반환', () => {
    // @ts-expect-error 의도적으로 잘못된 입력
    expect(getProfile('bogus').id).toBe('medium');
  });
});

describe('stageFromTokens 프로필 분기', () => {
  it('같은 토큰도 프로필에 따라 단계가 다르다', () => {
    const tokens = 150_000;
    // light: stubble(20k) < 150k < bushy(100k)? → 150k >= bushy(100k) → bushy
    expect(stageFromTokens(tokens, PROFILES.light).id).toBe('bushy');
    // medium: stubble(50k) <= 150k < bushy(300k) → stubble
    expect(stageFromTokens(tokens, PROFILES.medium).id).toBe('stubble');
    // heavy: 150k < stubble(200k) → smooth
    expect(stageFromTokens(tokens, PROFILES.heavy).id).toBe('smooth');
  });

  it('heavy 프로필은 1M에서도 북슬북슬 (관대)', () => {
    expect(stageFromTokens(1_000_000, PROFILES.heavy).id).toBe('bushy');
  });
});
