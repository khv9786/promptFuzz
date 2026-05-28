import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  shims: true,
  minify: false,
  // dynamic import된 UI 컴포넌트를 별도 chunk로 분리해야
  // shave 호출 전까지 ink/react가 평가되지 않는다.
  splitting: true,
  // ink/react는 dynamic import(shave 명령에서만)로 로드한다.
  // 정적 번들에서 제외해 tick/status의 부팅 비용을 방어한다.
  external: ['ink', 'react'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
