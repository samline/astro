import { test, expect } from '@playwright/test'
import sections from '../landing/src/i18n/translations/en/sections'
import { readFile } from 'node:fs/promises'

test('Home onboarding links to requirements and public installation commands', async ({
  page
}) => {
  await page.goto('./')
  await page
    .locator('#how')
    .getByRole('link', { name: sections.gettingStarted.integrationLabel })
    .click()
  await expect(page.locator('#requirements')).toBeVisible()
  await expect(
    page.locator('[data-group=docs-create-tools]').getByRole('tabpanel')
  ).toContainText('npx @samline/astro my-site')
})

test('kickoff guide copies the canonical prompt and serves standalone downloads', async ({
  page,
  context,
  request
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('docs/guides/agent-workflows/')
  const source = await readFile(
    new URL(
      '../../.agents/skills/samline-project-kickoff/references/kickoff-prompt.md',
      import.meta.url
    ),
    'utf8'
  )
  const copy = page.getByRole('button', { name: 'Copy project kickoff prompt' })
  await copy.click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(source.split('\n---\n')[1].trim() + '\n')
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  }
  const promptLink = page.getByRole('link', {
    name: 'Download the English prompt'
  })
  const promptResponse = await request.get(
    (await promptLink.getAttribute('href')) as string
  )
  expect(promptResponse.ok()).toBe(true)
  expect(await promptResponse.text()).toBe(source)
  const archiveLink = page.getByRole('link', {
    name: 'Download the skill with its prompt and inventory contract'
  })
  const archive = await request.get(
    (await archiveLink.getAttribute('href')) as string
  )
  expect(archive.ok()).toBe(true)
  expect(await archive.body()).toEqual(
    await readFile(
      new URL(
        '../docs/public/downloads/samline-project-kickoff.zip',
        import.meta.url
      )
    )
  )
})

test('personal packages use curated destinations and make Forms availability explicit', async ({
  page
}) => {
  await page.goto('./')
  const section = page.locator('#packages')
  await expect(section.getByRole('link', { name: /Drawer/ })).toHaveAttribute(
    'href',
    'https://samline.github.io/drawer/'
  )
  await expect(section.getByRole('link', { name: /Ticker/ })).toHaveAttribute(
    'href',
    'https://samline.github.io/ticker/'
  )
  await expect(section.getByRole('link', { name: /Forms/ })).toHaveAttribute(
    'href',
    'https://www.npmjs.com/package/@samline/forms'
  )
  await expect(section).toContainText('Website coming next')
})
