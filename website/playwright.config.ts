import { defineConfig } from '@playwright/test'
import { project } from './shared/lib/project.mjs'
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:4338' + project.base,
    browserName: 'chromium'
  },
  webServer: {
    command:
      'pnpm --dir landing run preview --host 127.0.0.1 --port 4338 --ignore-lock',
    url: 'http://127.0.0.1:4338' + project.base,
    reuseExistingServer: false
  }
})
