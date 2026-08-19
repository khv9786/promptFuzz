import { describe, it, expect, vi, beforeEach } from 'vitest';

const hoisted = vi.hoisted(() => ({
  impl: null as ((args: string[]) => string) | null,
}));

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn((_cmd: string, args: string[]) => {
    if (!hoisted.impl) throw new Error('not mocked');
    return hoisted.impl(args);
  }),
}));

import { getGitBranchLabel } from '../src/state/git.js';

describe('getGitBranchLabel', () => {
  beforeEach(() => {
    hoisted.impl = null;
  });

  it('브랜치명을 그대로 반환한다', () => {
    hoisted.impl = (args) => (args[0] === 'rev-parse' && args.includes('--abbrev-ref') ? 'main' : '');
    expect(getGitBranchLabel('/repo')).toBe('main');
  });

  it('detached HEAD면 짧은 SHA로 대체한다', () => {
    hoisted.impl = (args) => {
      if (args.includes('--abbrev-ref')) return 'HEAD';
      if (args.includes('--short')) return 'a1b2c3d';
      return '';
    };
    expect(getGitBranchLabel('/repo')).toBe('a1b2c3d');
  });

  it('git repo가 아니면 null', () => {
    hoisted.impl = () => {
      throw new Error('not a git repository');
    };
    expect(getGitBranchLabel('/not-a-repo')).toBeNull();
  });
});
