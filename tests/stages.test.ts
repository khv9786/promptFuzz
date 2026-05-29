import { describe, it, expect } from 'vitest';
import { stageFromTokens, getStage, STAGES, higherStage } from '../src/state/stages.js';
import { PROFILES } from '../src/state/profiles.js';

const medium = PROFILES.medium;

describe('stages', () => {
  it('5개 단계가 정의되어 있다', () => {
    expect(STAGES).toHaveLength(5);
  });

  it('0 토큰 → 매끈 (medium)', () => {
    expect(stageFromTokens(0, medium).id).toBe('smooth');
  });

  it('49,999 토큰 → 매끈 (medium 임계치 직전)', () => {
    expect(stageFromTokens(49_999, medium).id).toBe('smooth');
  });

  it('50,000 토큰 → 까끌까끌 (medium 임계치 정확)', () => {
    expect(stageFromTokens(50_000, medium).id).toBe('stubble');
  });

  it('300,000 토큰 → 북슬북슬 (medium)', () => {
    expect(stageFromTokens(300_000, medium).id).toBe('bushy');
  });

  it('1,500,000 토큰 → 따갑따갑 (medium)', () => {
    expect(stageFromTokens(1_500_000, medium).id).toBe('rugged');
  });

  it('5,000,000 토큰 → 고슴도치 (medium)', () => {
    expect(stageFromTokens(5_000_000, medium).id).toBe('hermit');
  });

  it('아주 큰 값에서도 고슴도치 유지', () => {
    expect(stageFromTokens(100_000_000, medium).id).toBe('hermit');
  });

  it('getStage로 한국어 이름 조회 (의태어)', () => {
    expect(getStage('smooth').nameKr).toBe('매끈');
    expect(getStage('stubble').nameKr).toBe('까끌까끌');
    expect(getStage('bushy').nameKr).toBe('북슬북슬');
    expect(getStage('rugged').nameKr).toBe('따갑따갑');
    expect(getStage('hermit').nameKr).toBe('고슴도치');
  });

  it('higherStage는 더 높은 단계를 반환', () => {
    expect(higherStage('smooth', 'rugged')).toBe('rugged');
    expect(higherStage('hermit', 'bushy')).toBe('hermit');
    expect(higherStage('stubble', 'stubble')).toBe('stubble');
  });

  it('강화된 buddyFace (이모지 포함)', () => {
    expect(getStage('smooth').buddyFace).toBe('(◕ᴗ◕)✨');
    expect(getStage('stubble').buddyFace).toBe('(•_• )?');
    expect(getStage('bushy').buddyFace).toBe('(>﹏<;)');
    expect(getStage('rugged').buddyFace).toBe('(╥﹏╥)💧');
    expect(getStage('hermit').buddyFace).toBe('(;﹏;)🆘');
  });
});
