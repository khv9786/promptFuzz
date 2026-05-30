import { describe, it, expect } from 'vitest';
import {
  grassLevel,
  summarize,
  listDates,
  gridHeaderLine,
  gridLabelField,
  weekLabel,
  GRID_CELL_SEP,
} from '../src/commands/logView.js';
import { PROFILES } from '../src/state/profiles.js';
import type { DailyEntry } from '../src/types/index.js';

const medium = PROFILES.medium;

describe('grassLevel (medium 기준)', () => {
  it('0 토큰 → none', () => {
    expect(grassLevel(0, medium)).toBe('none');
  });
  it('stubble(50k) 미만 → light', () => {
    expect(grassLevel(10_000, medium)).toBe('light');
  });
  it('stubble~bushy → medium', () => {
    expect(grassLevel(100_000, medium)).toBe('medium');
  });
  it('bushy~rugged → heavy', () => {
    expect(grassLevel(500_000, medium)).toBe('heavy');
  });
  it('rugged 이상 → extreme', () => {
    expect(grassLevel(2_000_000, medium)).toBe('extreme');
  });
});

describe('listDates', () => {
  it('N일치 날짜를 오래된 것부터 반환', () => {
    const now = new Date('2026-05-28T12:00:00');
    const dates = listDates(3, now);
    expect(dates).toEqual(['2026-05-26', '2026-05-27', '2026-05-28']);
  });
});

describe('summarize', () => {
  const now = new Date('2026-05-28T12:00:00');

  function entry(o: Partial<DailyEntry> & { date: string }): DailyEntry {
    return { tokensAdded: 0, peakStage: 'smooth', shaveCount: 0, stretchCount: 0, ...o };
  }

  it('빈 로그 → 모든 합계 0', () => {
    const s = summarize({}, 7, 'medium', now);
    expect(s.totalShaves).toBe(0);
    expect(s.totalStretches).toBe(0);
    expect(s.peakStage).toBe('smooth');
    expect(s.peakDate).toBeNull();
    expect(s.entries).toHaveLength(7);
  });

  it('면도/스트레칭 합산 + 최고 단계 추적', () => {
    const log = {
      '2026-05-27': entry({ date: '2026-05-27', shaveCount: 1, stretchCount: 2, peakStage: 'bushy' }),
      '2026-05-28': entry({ date: '2026-05-28', shaveCount: 2, stretchCount: 1, peakStage: 'rugged' }),
    };
    const s = summarize(log, 7, 'medium', now);
    expect(s.totalShaves).toBe(3);
    expect(s.totalStretches).toBe(3);
    expect(s.peakStage).toBe('rugged');
    expect(s.peakDate).toBe('2026-05-28');
  });

  it('범위 밖(N일 초과) entry는 집계 제외', () => {
    const log = {
      '2026-01-01': entry({ date: '2026-01-01', shaveCount: 99, peakStage: 'hermit' }),
      '2026-05-28': entry({ date: '2026-05-28', shaveCount: 1 }),
    };
    const s = summarize(log, 7, 'medium', now);
    expect(s.totalShaves).toBe(1); // 1월 entry 제외
    expect(s.peakStage).toBe('smooth');
  });
});

describe('잔디 격자 레이아웃 (정렬)', () => {
  it('헤더 = 7칸 라벨 영역 + 영문 요일(M T W T F S S)', () => {
    expect(gridHeaderLine()).toBe('       M  T  W  T  F  S  S');
  });

  it('weekLabel: 가장 오래된 주는 Nw, 이번주(1)는 now', () => {
    expect(weekLabel(5)).toBe('4w');
    expect(weekLabel(2)).toBe('1w');
    expect(weekLabel(1)).toBe('now');
  });

  it('라벨 영역은 항상 7칸 (ASCII라 글자수 = 시각 폭)', () => {
    expect(gridLabelField('')).toHaveLength(7);
    expect(gridLabelField('4w')).toHaveLength(7);
    expect(gridLabelField('now')).toHaveLength(7);
  });

  it('데이터 행의 시각 폭이 헤더와 동일', () => {
    const row = gridLabelField('now') + Array(7).fill('·').join(GRID_CELL_SEP);
    expect(row).toHaveLength(gridHeaderLine().length);
  });

  it('부분 주(앞쪽 공백 셀)도 동일 폭 유지', () => {
    const cells = [' ', ' ', '·', '·', '·', '·', '·'];
    const row = gridLabelField('4w') + cells.join(GRID_CELL_SEP);
    expect(row).toHaveLength(gridHeaderLine().length);
  });
});
