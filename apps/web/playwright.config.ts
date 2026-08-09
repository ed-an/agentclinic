import { defineConfig, devices } from '@playwright/test';
import { randomBytes, scryptSync } from 'node:crypto';

const e2ePassword =
  process.env.AGENTCLINIC_E2E_PASSWORD ?? randomBytes(48).toString('base64url');
const emails = ['staff', 'ada', 'juniper', 'patch'].map(
  (name) => `${name}@demo.agentclinic.test`,
);
const hashes = Object.fromEntries(
  emails.map((email) => {
    const salt = randomBytes(32);
    const key = scryptSync(e2ePassword, salt, 64, {
      N: 2 ** 17,
      r: 8,
      p: 1,
      maxmem: 256 * 1024 * 1024,
    });
    return [
      email,
      `scrypt-v1$131072$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`,
    ];
  }),
);

process.env.AGENTCLINIC_E2E_PASSWORD = e2ePassword;

const port = 3200;

export default defineConfig({
  testDir: './e2e',
  // Browser tests share one isolated SQLite database; serialize files so
  // booking and lifecycle fixtures cannot consume each other's slots.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'node ../../scripts/browser-server.mjs',
      url: 'http://127.0.0.1:3201/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        AGENTCLINIC_ENABLE_DEMO_ACCOUNTS: 'true',
        AGENTCLINIC_DEMO_PASSWORD_HASHES: JSON.stringify(hashes),
        AGENTCLINIC_WEB_ORIGIN: 'http://127.0.0.1:3200',
      },
    },
    {
      command: `AGENTCLINIC_API_URL=http://127.0.0.1:3201 npm run start -- -p ${port}`,
      url: `http://127.0.0.1:${port}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { AGENTCLINIC_E2E_PASSWORD: e2ePassword },
    },
  ],
});
