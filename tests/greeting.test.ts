import { describe, it, expect } from 'vitest';
import { timeOfDayGreeting } from '../src/ui/greeting.js';

describe('timeOfDayGreeting (시계만 읽음 — content-blind)', () => {
  it('아침(5~10) → 좋은 아침', () => {
    expect(timeOfDayGreeting(5)).toBe('좋은 아침이에요!');
    expect(timeOfDayGreeting(9)).toBe('좋은 아침이에요!');
    expect(timeOfDayGreeting(10)).toBe('좋은 아침이에요!');
  });
  it('낮(11~16) → 인사 생략(null)', () => {
    expect(timeOfDayGreeting(11)).toBeNull();
    expect(timeOfDayGreeting(13)).toBeNull();
    expect(timeOfDayGreeting(16)).toBeNull();
  });
  it('저녁(17~22) → 고생 많았어요', () => {
    expect(timeOfDayGreeting(17)).toBe('오늘도 고생 많았어요');
    expect(timeOfDayGreeting(22)).toBe('오늘도 고생 많았어요');
  });
  it('새벽/밤(23~4) → 무리하지 마요', () => {
    expect(timeOfDayGreeting(23)).toBe('이 시간까지...? 무리하지 마요');
    expect(timeOfDayGreeting(0)).toBe('이 시간까지...? 무리하지 마요');
    expect(timeOfDayGreeting(4)).toBe('이 시간까지...? 무리하지 마요');
  });
});
