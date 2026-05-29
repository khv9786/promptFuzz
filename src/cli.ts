import { Command } from 'commander';
import chalk from 'chalk';
import { installCommand } from './commands/install.js';
import { uninstallCommand } from './commands/uninstall.js';
import { statusCommand } from './commands/status.js';
import { shaveCommand } from './commands/shave.js';
import { tickCommand } from './commands/tick.js';
import { configCommand } from './commands/config.js';
import { logCommand } from './commands/log.js';
import { resetCommand } from './commands/reset.js';

// 인자 없이 'promptfuzz'만 실행된 경우 환영 메시지 후 종료.
// --help / -h / 서브커맨드는 commander에 그대로 위임.
if (process.argv.length === 2) {
  printWelcome();
  process.exit(0);
}

function printWelcome(): void {
  const lines = [
    chalk.cyan.bold('🧔 PromptFuzz') + chalk.cyan(' — 토큰을 수염으로, 휴식을 면도로'),
    '',
    '  ' + chalk.bold('promptfuzz status') + chalk.dim('       오늘의 수염 보기'),
    '  ' + chalk.bold('promptfuzz shave') + chalk.dim('        면도하고 스트레칭'),
    '  ' + chalk.bold('promptfuzz install') + chalk.dim('      Claude Code에 연결'),
    '  ' + chalk.bold('promptfuzz --help') + chalk.dim('       전체 명령 보기'),
    '',
    '  ' + chalk.dim("처음이신가요? ") + chalk.cyan("'promptfuzz install'") + chalk.dim('부터 시작하세요.'),
  ];
  console.log(lines.join('\n'));
}

const program = new Command();

program
  .name('promptfuzz')
  .description('토큰을 수염으로, 휴식을 면도로 — Claude Code 사용 시간 관리 토이')
  .version('0.1.0');

program
  .command('install')
  .description('Claude Code에 PromptFuzz hook을 설치합니다')
  .action(installCommand);

program
  .command('uninstall')
  .description('PromptFuzz hook을 제거합니다 (~/.promptfuzz/는 유지)')
  .action(uninstallCommand);

program
  .command('status')
  .description('현재 수염 상태를 보여줍니다')
  .action(statusCommand);

program
  .command('shave')
  .description('면도하고 스트레칭 카드를 받습니다')
  .action(shaveCommand);

program
  .command('tick')
  .description('[내부 전용] Hook이 호출하는 갱신 명령')
  .action(tickCommand);

program
  .command('config')
  .description('임계치 프로필을 보거나 변경합니다')
  .option('--threshold [profile]', '프로필 변경 (light|medium|heavy)')
  .action((opts) => configCommand(opts));

program
  .command('log')
  .description('일자별 활동 로그를 잔디로 봅니다')
  .option('--days <n>', '최근 N일 (최대 90)')
  .option('--json', 'JSON으로 출력')
  .action((opts) => logCommand(opts));

program
  .command('reset')
  .description('모든 데이터 + hook을 완전히 초기화합니다')
  .option('-y, --yes', '확인 없이 진행 (비대화형/자동화용)')
  .action((opts) => resetCommand(opts));

program.parseAsync().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
