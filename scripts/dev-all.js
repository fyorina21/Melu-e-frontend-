#!/usr/bin/env node

/**
 * dev-all.js - Boot Rails Backend & React Native Web Frontend concurrently
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const net = require('net');
const os = require('os');

const FRONTEND_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.resolve(FRONTEND_DIR, '../melue-foundation/melue-backend');

const isWindows = os.platform() === 'win32';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(prefix, color, message) {
  const lines = message.toString().split('\n');
  for (const line of lines) {
    if (line.trim().length > 0) {
      console.log(`${color}${prefix}${colors.reset} ${line}`);
    }
  }
}

function checkPort(port, host = '127.0.0.1', timeout = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      status = true;
      socket.destroy();
    });
    socket.once('timeout', () => {
      socket.destroy();
    });
    socket.once('error', () => {
      socket.destroy();
    });
    socket.once('close', () => {
      resolve(status);
    });

    socket.connect(port, host);
  });
}

async function verifyPostgres() {
  console.log(`\n${colors.cyan}🔍 [1/3] Checking PostgreSQL status...${colors.reset}`);
  const isPostgresUp = await checkPort(5432);

  if (isPostgresUp) {
    console.log(`  ${colors.green}✓ PostgreSQL is active and accepting connections on port 5432.${colors.reset}`);
    return true;
  }

  // If port check fails on Windows, check service
  if (isWindows) {
    try {
      const output = execSync('powershell -NoProfile -Command "Get-Service *postgres* | Select-Object -ExpandProperty Status"', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      if (output.includes('Running')) {
        console.log(`  ${colors.green}✓ PostgreSQL service is running.${colors.reset}`);
        return true;
      }
    } catch (_) {}
  }

  console.log(`  ${colors.yellow}⚠️ Warning: PostgreSQL might not be running on port 5432.${colors.reset}`);
  console.log(`  ${colors.dim}Make sure your local PostgreSQL service is started.${colors.reset}`);
  return false;
}

function runCommandSync(cmd, args, cwd, stepName) {
  console.log(`\n${colors.cyan}⚙️  [2/3] Preparing Rails Backend (${stepName})...${colors.reset}`);
  try {
    execSync(`${cmd} ${args.join(' ')}`, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
  } catch (error) {
    console.error(`${colors.red}Error executing ${cmd} in ${cwd}:${colors.reset}`, error.message);
    throw error;
  }
}

function spawnProcess(cmd, args, cwd, prefix, color) {
  const child = spawn(cmd, args, {
    cwd,
    shell: true,
    env: { ...process.env, PORT: '3000' },
  });

  child.stdout.on('data', (data) => log(prefix, color, data));
  child.stderr.on('data', (data) => log(prefix, color, data));

  return child;
}

function killProcess(child) {
  if (!child || !child.pid) return;

  if (isWindows) {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } catch (_) {
      try { child.kill('SIGKILL'); } catch (_) {}
    }
  } else {
    try {
      process.kill(-child.pid, 'SIGINT');
    } catch (_) {
      try { child.kill('SIGINT'); } catch (_) {}
    }
  }
}

async function main() {
  console.log(`\n${colors.bright}====================================================${colors.reset}`);
  console.log(`${colors.bright}  MELUE Full-Stack Dev Environment Launcher${colors.reset}`);
  console.log(`${colors.bright}====================================================${colors.reset}`);

  // 1. Verify Postgres
  await verifyPostgres();

  // 2. Prepare Rails
  try {
    runCommandSync('bundle', ['check'], BACKEND_DIR, 'bundle check');
  } catch (_) {
    console.log(`  ${colors.yellow}Running bundle install...${colors.reset}`);
    runCommandSync('bundle', ['install'], BACKEND_DIR, 'bundle install');
  }

  runCommandSync('bundle', ['exec', 'rails', 'db:prepare'], BACKEND_DIR, 'rails db:prepare');

  // 3. Boot both services
  console.log(`\n${colors.cyan}🚀 [3/3] Starting Rails (port 3000) & React Native Web (port 8081)...${colors.reset}`);
  console.log(`  ${colors.green}• Backend API:${colors.reset}   http://localhost:3000`);
  console.log(`  ${colors.green}• Frontend Web:${colors.reset}  http://localhost:8081`);
  console.log(`  ${colors.dim}Press Ctrl+C to stop both servers at any time.${colors.reset}\n`);

  const railsChild = spawnProcess(
    'bundle',
    ['exec', 'rails', 's', '-p', '3000'],
    BACKEND_DIR,
    '[rails]',
    colors.cyan
  );

  const expoChild = spawnProcess(
    'npx',
    ['expo', 'start', '--web', '--port', '8081'],
    FRONTEND_DIR,
    '[expo ]',
    colors.magenta
  );

  let shuttingDown = false;
  const cleanup = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${colors.yellow}Shutting down development servers...${colors.reset}`);
    killProcess(railsChild);
    killProcess(expoChild);
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  railsChild.on('close', (code) => {
    if (!shuttingDown) {
      console.log(`${colors.red}[rails] Process exited with code ${code}${colors.reset}`);
      cleanup();
    }
  });

  expoChild.on('close', (code) => {
    if (!shuttingDown) {
      console.log(`${colors.red}[expo ] Process exited with code ${code}${colors.reset}`);
      cleanup();
    }
  });
}

main().catch((err) => {
  console.error(`${colors.red}Failed to start dev environment:${colors.reset}`, err);
  process.exit(1);
});
