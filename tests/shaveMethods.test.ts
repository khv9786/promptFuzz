import { describe, it, expect } from 'vitest';
import {
  SHAVE_METHODS,
  methodFromKey,
  SHAVE_MISS_MESSAGES,
  pickMissMessage,
  randomDir,
  judgeDirection,
  keyToDir,
  ALL_DIRS,
  DIR_GLYPH,
  PLUCK_WINDOW_MS,
} from '../src/ui/shaveReducer.js';

describe('SHAVE_METHODS', () => {
  it('4종, 난이도 오름차순(레이저→전기→날→손)', () => {
    expect(SHAVE_METHODS.map((m) => m.id)).toEqual(['laser', 'electric', 'blade', 'pluck']);
  });
  it('각 방식에 이모지·라벨·설명', () => {
    for (const m of SHAVE_METHODS) {
      expect(m.emoji.length).toBeGreaterThan(0);
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.desc.length).toBeGreaterThan(0);
    }
  });
});

describe('methodFromKey', () => {
  it('1~4 → 방식', () => {
    expect(methodFromKey('1')).toBe('laser');
    expect(methodFromKey('2')).toBe('electric');
    expect(methodFromKey('3')).toBe('blade');
    expect(methodFromKey('4')).toBe('pluck');
  });
  it('그 외 입력 → null', () => {
    for (const k of ['0', '5', 'q', '', 'a', ' ', '12']) {
      expect(methodFromKey(k)).toBeNull();
    }
  });
});

describe('pickMissMessage', () => {
  it('항상 SHAVE_MISS_MESSAGES 안에서 반환 (rand 주입)', () => {
    for (const r of [0, 0.2, 0.5, 0.75, 0.999]) {
      expect(SHAVE_MISS_MESSAGES).toContain(pickMissMessage(() => r));
    }
  });
  it('rand=0 → 첫 메시지', () => {
    expect(pickMissMessage(() => 0)).toBe(SHAVE_MISS_MESSAGES[0]);
  });
  it('메시지가 비어있지 않고 코믹(피·심각 표현 없음)', () => {
    expect(SHAVE_MISS_MESSAGES.length).toBeGreaterThanOrEqual(3);
    for (const m of SHAVE_MISS_MESSAGES) {
      expect(m.length).toBeGreaterThan(0);
      expect(m).not.toMatch(/피|죽|심각/);
    }
  });
});

describe('randomDir', () => {
  it('상하좌우 사방 집합 (날 면도기·손으로 뽑기 공통)', () => {
    expect(ALL_DIRS).toEqual(['up', 'down', 'left', 'right']);
    for (const r of [0, 0.25, 0.5, 0.75, 0.99]) expect(ALL_DIRS).toContain(randomDir(ALL_DIRS, () => r));
  });
  it('rand=0 → 첫 방향', () => {
    expect(randomDir(ALL_DIRS, () => 0)).toBe('up');
  });
});

describe('judgeDirection', () => {
  it('같으면 hit', () => {
    expect(judgeDirection('left', 'left')).toBe('hit');
    expect(judgeDirection('up', 'up')).toBe('hit');
  });
  it('다르거나 없으면 miss', () => {
    expect(judgeDirection('left', 'right')).toBe('miss');
    expect(judgeDirection('up', 'down')).toBe('miss');
    expect(judgeDirection('left', null)).toBe('miss');
  });
});

describe('keyToDir', () => {
  it('방향키 → 방향', () => {
    expect(keyToDir({ upArrow: true })).toBe('up');
    expect(keyToDir({ downArrow: true })).toBe('down');
    expect(keyToDir({ leftArrow: true })).toBe('left');
    expect(keyToDir({ rightArrow: true })).toBe('right');
  });
  it('방향키 아니면 null', () => {
    expect(keyToDir({})).toBeNull();
    expect(keyToDir({ return: true } as never)).toBeNull();
  });
});

describe('DIR_GLYPH / 상수', () => {
  it('방향별 화살표 글리프', () => {
    expect(DIR_GLYPH).toEqual({ up: '↑', down: '↓', left: '←', right: '→' });
  });
  it('손뽑기 제한 1초', () => {
    expect(PLUCK_WINDOW_MS).toBe(1000);
  });
});
