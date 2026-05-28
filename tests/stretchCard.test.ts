import { describe, it, expect } from 'vitest';
import { classifyStretchKey } from '../src/ui/stretchCardKey.js';

describe('classifyStretchKey', () => {
  it('Enter → complete', () => {
    expect(classifyStretchKey('', { return: true })).toBe('complete');
  });

  it('s → swap', () => {
    expect(classifyStretchKey('s')).toBe('swap');
  });

  it('q → abort', () => {
    expect(classifyStretchKey('q')).toBe('abort');
  });

  it('Ctrl+C → abort', () => {
    expect(classifyStretchKey('c', { ctrl: true })).toBe('abort');
  });

  it('그 외 키 → noop', () => {
    expect(classifyStretchKey('a')).toBe('noop');
    expect(classifyStretchKey('x', {})).toBe('noop');
  });
});
