import { execFileSync } from 'node:child_process';

/**
 * cwd 기준 현재 git 브랜치명을 동기 조회한다.
 * statusLine 새로고침 주기(2초)가 짧아 비동기 오버헤드를 피하려고 동기 호출을 쓴다.
 *
 * - detached HEAD → 짧은 SHA(7자)로 대체.
 * - git repo 아님 / git 미설치 / 타임아웃(200ms) → null (표시 생략, 비파괴).
 */
export function getGitBranchLabel(cwd: string): string | null {
  const run = (args: string[]): string =>
    execFileSync('git', args, { cwd, timeout: 200, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();

  try {
    const branch = run(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (branch && branch !== 'HEAD') return branch;
    const sha = run(['rev-parse', '--short', 'HEAD']);
    return sha || null;
  } catch {
    return null;
  }
}
