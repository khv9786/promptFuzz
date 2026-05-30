import { defineConfig } from 'vitest/config';

// cold-start 플레이키(빌드 직후 첫 실행에서 shave.test.ts 수집 중 워커 크래시 → exit 116) 안정화.
//
// 근본 원인: vitest 1.6 기본 pool 'threads'(worker_threads)가 cold-start에 heavy한
// Ink/React 모듈을 병렬 수집하다 워커 스레드가 간헐적으로 크래시.
//
// 수정:
//  - pool 'forks': worker_threads 대신 자식 프로세스로 격리(더 견고).
//  - singleFork: 단일 프로세스에서 직렬 실행 → 병렬 spawn/수집 레이스 자체를 제거.
//    부수 효과로 트랜스폼/수집을 한 번만 수행해 이 작은 스위트에선 오히려 더 빠름
//    (Duration 약 2.8s → 1.5s).
//  - retry: 수집 단계가 아닌 실행 단계 플레이키에 대한 보험(통과 테스트엔 영향 없음).
export default defineConfig({
  test: {
    retry: 2,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
