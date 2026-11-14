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
  const graphLink = page.getByRole('link', {
    name: 'Download the Codebase Memory skill and MIT license'
  })
  const graphArchive = await request.get(
    (await graphLink.getAttribute('href')) as string
  )
  expect(graphArchive.ok()).toBe(true)
  expect(await graphArchive.body()).toEqual(
    await readFile(
      new URL('../docs/public/downloads/codebase-memory.zip', import.meta.url)
    )
  )
})

test('personal packages use their curated published websites', async ({
  page
}) => {
  await page.goto('./')
  const section = page.locator('#packages [data-packages]').first()
  await expect(
    section.getByRole('link', { name: 'Drawer', exact: true })
  ).toHaveAttribute('href', 'https://samline.github.io/drawer/')
  await expect(
    section.getByRole('link', { name: 'Ticker', exact: true })
  ).toHaveAttribute('href', 'https://samline.github.io/ticker/')
  await expect(
    section.getByRole('link', { name: 'Notify', exact: true })
  ).toHaveAttribute('href', 'https://samline.github.io/notify/')
  await expect(
    section.getByRole('link', { name: 'Forms', exact: true })
  ).toHaveAttribute('href', 'https://samline.github.io/forms/')
  await expect(section).not.toContainText('Website coming next')
})

test('package ticker keeps one row and supports playback and manual navigation', async ({
  page
}) => {
  await page.goto('./')
  const catalog = page.locator('package-catalog')
  await catalog.scrollIntoViewIfNeeded()
  const viewport = catalog.locator('.ticker-wrapper')
  await expect(viewport).toHaveAttribute('data-ready', 'true')
  await expect(
    catalog.locator('[data-packages]').first().locator(':scope > li')
  ).toHaveCount(16)
  await catalog.getByRole('button', { name: 'Pause animation' }).click()
  await expect(viewport).toHaveAttribute('data-playing', 'false')
  await expect(
    catalog.getByRole('button', { name: 'Play animation' })
  ).toBeVisible()
  const position = await viewport.getAttribute('style')
  await catalog.getByRole('button', { name: 'Next packages' }).click()
  await expect.poll(() => viewport.getAttribute('style')).not.toBe(position)
  await catalog.getByRole('button', { name: 'Play animation' }).click()
  await expect(
    catalog.getByRole('button', { name: 'Pause animation' })
  ).toBeVisible()
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme
      }, theme)
      const geometry = await catalog
        .locator('[data-packages]')
        .first()
        .evaluate((list) => {
          const cards = [...list.children].map((card) =>
            card.getBoundingClientRect()
          )
          return {
            tops: cards.map((card) => card.top),
            page: document.documentElement.scrollWidth
          }
        })
      expect(
        Math.max(...geometry.tops) - Math.min(...geometry.tops)
      ).toBeLessThan(1)
      expect(geometry.page).toBeLessThanOrEqual(width)
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(viewport).toHaveAttribute('data-playing', 'false')
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await page.setViewportSize({ width: 320, height: 900 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(320)
})

test('package catalog remains scrollable without JavaScript', async ({
  browser,
  baseURL
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 }
  })
  const page = await context.newPage()
  await page.goto(baseURL!)
  const catalog = page.locator('package-catalog')
  await expect(catalog.locator('[data-packages] > li')).toHaveCount(16)
  expect(
    await catalog
      .locator('.catalog-viewport')
      .evaluate((el) => el.scrollWidth > el.clientWidth)
  ).toBe(true)
  await expect(catalog.locator('[data-controls]')).toHaveAttribute('inert', '')
  await context.close()
})

test('package ticker reveals keyboard links and cleans up before remounting', async ({
  page
}) => {
  await page.goto('./')
  const catalog = page.locator('package-catalog')
  await catalog.scrollIntoViewIfNeeded()
  const viewport = catalog.locator('.ticker-wrapper')
  await expect(viewport).toHaveAttribute('data-ready', 'true')
  const lastTitle = catalog
    .locator('[data-packages]')
    .first()
    .locator('h3 a')
    .last()
  await lastTitle.focus()
  await expect(lastTitle).toBeFocused()
  await expect(viewport).toHaveAttribute('data-playing', 'false')
  expect(
    await lastTitle.evaluate((link) => {
      const bounds = link.getBoundingClientRect()
      const viewport = link.closest('.ticker-wrapper')!.getBoundingClientRect()
      return (
        bounds.left >= viewport.left - 1 && bounds.right <= viewport.right + 1
      )
    })
  ).toBe(true)
  await catalog.evaluate((element) => {
    const parent = element.parentElement!
    element.remove()
    parent.append(element)
  })
  await expect(viewport).toHaveCount(1)
  await expect(viewport).toHaveAttribute('data-ready', 'true')
  await expect(
    catalog.locator('[data-packages]').first().locator(':scope > li')
  ).toHaveCount(16)
  await catalog.getByRole('button', { name: 'Pause animation' }).click()
  await expect(
    catalog.getByRole('button', { name: 'Play animation' })
  ).toBeVisible()
})
