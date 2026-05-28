import { describe, it, expect } from 'vitest';
import { stageFromTokens, getStage, STAGES } from '../src/state/stages.js';

describe('stages', () => {
  it('5개 단계가 정의되어 있다', () => {
    expect(STAGES).toHaveLength(5);
  });

  it('0 토큰 → 매끈', () => {
    expect(stageFromTokens(0).id).toBe('smooth');
  });

  it('9999 토큰 → 매끈 (임계치 직전)', () => {
    expect(stageFromTokens(9_999).id).toBe('smooth');
  });

  it('10000 토큰 → 까끌까끌 (임계치 정확)', () => {
    expect(stageFromTokens(10_000).id).toBe('stubble');
  });

  it('49999 토큰 → 까끌까끌', () => {
    expect(stageFromTokens(49_999).id).toBe('stubble');
  });

  it('50000 토큰 → 북슬북슬', () => {
    expect(stageFromTokens(50_000).id).toBe('bushy');
  });

  it('200000 토큰 → 따갑따갑', () => {
    expect(stageFromTokens(200_000).id).toBe('rugged');
  });

  it('500000 토큰 → 고슴도치', () => {
    expect(stageFromTokens(500_000).id).toBe('hermit');
  });

  it('아주 큰 값에서도 고슴도치 유지', () => {
    expect(stageFromTokens(10_000_000).id).toBe('hermit');
  });

  it('getStage로 한국어 이름 조회 (의태어)', () => {
    expect(getStage('smooth').nameKr).toBe('매끈');
    expect(getStage('stubble').nameKr).toBe('까끌까끌');
    expect(getStage('bushy').nameKr).toBe('북슬북슬');
    expect(getStage('rugged').nameKr).toBe('따갑따갑');
    expect(getStage('hermit').nameKr).toBe('고슴도치');
  });
});
