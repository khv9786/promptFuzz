import { describe, it, expect } from 'vitest';
import {
  parseQuietHours,
  isQuietNow,
  isValidQuietHours,
  formatQuietHours,
} from '../src/state/quietHours.js';

describe('parseQuietHours', () => {
  it('23-07 → {start:23,end:7}', () => {
    expect(parseQuietHours('23-07')).toEqual({ start: 23, end: 7 });
  });
  it('off → null', () => {
    expect(parseQuietHours('off')).toBeNull();
    expect(parseQuietHours('OFF')).toBeNull();
  });
  it('잘못된 형식 → undefined', () => {
    expect(parseQuietHours('25-99')).toBeUndefined();
    expect(parseQuietHours('abc')).toBeUndefined();
    expect(parseQuietHours('23')).toBeUndefined();
  });
  it('start === end → undefined (0시간)', () => {
    expect(parseQuietHours('10-10')).toBeUndefined();
  });
  it('한 자리 시간 허용', () => {
    expect(parseQuietHours('9-17')).toEqual({ start: 9, end: 17 });
  });
});

describe('isQuietNow', () => {
  it('null이면 항상 false', () => {
    expect(isQuietNow(null, 3)).toBe(false);
  });

  it('자정 안 넘는 범위 (9-17)', () => {
    const q = { start: 9, end: 17 };
    expect(isQuietNow(q, 8)).toBe(false);
    expect(isQuietNow(q, 9)).toBe(true); // start 포함
    expect(isQuietNow(q, 16)).toBe(true);
    expect(isQuietNow(q, 17)).toBe(false); // end 제외
  });

  it('자정 넘는 범위 (23-07)', () => {
    const q = { start: 23, end: 7 };
    expect(isQuietNow(q, 23)).toBe(true); // start 포함
    expect(isQuietNow(q, 0)).toBe(true);
    expect(isQuietNow(q, 3)).toBe(true);
    expect(isQuietNow(q, 6)).toBe(true);
    expect(isQuietNow(q, 7)).toBe(false); // end 제외
    expect(isQuietNow(q, 12)).toBe(false);
    expect(isQuietNow(q, 22)).toBe(false);
  });
});

describe('isValidQuietHours', () => {
  it('null 허용', () => {
    expect(isValidQuietHours(null)).toBe(true);
  });
  it('정상 객체', () => {
    expect(isValidQuietHours({ start: 23, end: 7 })).toBe(true);
  });
  it('범위 밖/타입 오류 거부', () => {
    expect(isValidQuietHours({ start: 25, end: 7 })).toBe(false);
    expect(isValidQuietHours({ start: '23', end: 7 })).toBe(false);
    expect(isValidQuietHours({ start: 1.5, end: 7 })).toBe(false);
    expect(isValidQuietHours('23-07')).toBe(false);
  });
});

describe('formatQuietHours', () => {
  it('null → off, 객체 → HH-HH', () => {
    expect(formatQuietHours(null)).toBe('off');
    expect(formatQuietHours({ start: 23, end: 7 })).toBe('23-07');
    expect(formatQuietHours({ start: 9, end: 17 })).toBe('09-17');
  });
});
