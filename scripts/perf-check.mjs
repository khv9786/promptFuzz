#!/usr/bin/env node
/**
 * 부팅 시간 회귀 감지. `node dist/cli.js --version`을 여러 번 측정해
 * 평균이 임계(100ms)를 넘으면 비정상 종료(exit 1)한다.
 *
 * 사용: npm run build && node scripts/perf-check.mjs
 * CI에 추가하려면 build 이후 이 스크립트를 실행하는 스텝을 넣으면 된다.
 */
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { existsSync } from 'node:fs';

const THRESHOLD_MS = 100;
const RUNS = 7;
const WARMUP = 2;
const CLI = 'dist/cli.js';

if (!existsSync(CLI)) {
  console.error(`✗ ${CLI} 가 없습니다. 먼저 npm run build 하세요.`);
  process.exit(1);
}

// 워밍업 (디스크 캐시 등 안정화)
for (let i = 0; i < WARMUP; i++) {
  spawnSync('node', [CLI, '--version'], { stdio: 'ignore' });
}

const times = [];
for (let i = 0; i < RUNS; i++) {
  const t0 = performance.now();
  const r = spawnSync('node', [CLI, '--version'], { stdio: 'ignore' });
  const dt = performance.now() - t0;
  if (r.status !== 0) {
    console.error(`✗ --version 실행 실패 (exit ${r.status})`);
    process.exit(1);
  }
  times.push(dt);
}

times.sort((a, b) => a - b);
// 중앙값 (이상치에 덜 민감)
const median = times[Math.floor(times.length / 2)];
const avg = times.reduce((a, b) => a + b, 0) / times.length;

const fmt = (n) => `${n.toFixed(1)}ms`;
console.log(`boot --version: median ${fmt(median)} · avg ${fmt(avg)} · runs [${times.map((t) => t.toFixed(0)).join(', ')}]`);

if (median > THRESHOLD_MS) {
  console.error(`✗ 부팅 시간 회귀: median ${fmt(median)} > 임계 ${THRESHOLD_MS}ms`);
  process.exit(1);
}
console.log(`✓ 부팅 시간 OK (median ${fmt(median)} ≤ ${THRESHOLD_MS}ms)`);
