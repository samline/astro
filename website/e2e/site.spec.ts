import { test, expect } from '@playwright/test'
import { readFile, readdir } from 'node:fs/promises'
import { project } from '../shared/lib/project.mjs'
import { recipes } from '../shared/i18n/translations/en/recipes'
import demoCopy from '../shared/i18n/translations/en/demo'
import landingCopy from '../landing/src/i18n/translations/en'
const articles = (
  await readdir(new URL('../docs/src/content/docs/', import.meta.url), {
    recursive: true
  })
)
  .filter((path) => /\.mdx?$/.test(path))
  .map(
    (path) =>
      'docs/' +
      path
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '$1')
        .replace(/\/$/, '') +
      '/'
  )
const sourceReferences = JSON.parse(
  await readFile(
    new URL('../shared/data/references.json', import.meta.url),
    'utf8'
  )
) as { id: string }[]
const paths = [
  ...new Set([
    '',
    'examples/',
    'docs/',
    'docs/changelog/',
    ...sourceReferences.map((entry) => `docs/${entry.id}/`),
    ...articles.map((path) => path.replace('docs//', 'docs/'))
  ])
]
test('all routes share readable metadata and fit both themes and enlarged mobile text', async ({
  page
}) => {
  test.setTimeout(180000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of paths) {
    await page.goto(path || './')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('meta[charset]')).toHaveCount(1)
    await expect(page.locator('meta[name=viewport]')).toHaveCount(1)
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      new URL(path, project.url).href
    )
    await expect(page.locator('meta[name=robots]')).toHaveAttribute(
      'content',
      project.template
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large'
    )
    for (const width of [320, 768, 1440, 320]) {
      await page.setViewportSize({ width, height: 900 })
      for (const theme of ['light', 'dark']) {
        await page.evaluate((theme) => {
          document.documentElement.dataset.theme = theme
        }, theme)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          `${path} ${width} ${theme}`
        ).toBe(true)
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      `${path} enlarged: ${JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter((el) => {
              let p = el.parentElement
              while (p && p !== document.body) {
                if (
                  ['hidden', 'clip', 'auto', 'scroll'].includes(
                    getComputedStyle(p).overflowX
                  )
                )
                  return false
                p = p.parentElement
              }
              const r = el.getBoundingClientRect()
              return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)
            })
            .slice(0, 12)
            .map((el) => ({
              tag: el.tagName,
              class: el.className,
              text: el.textContent?.slice(0, 55),
              right: el.getBoundingClientRect().right
            }))
        )
      )}`
    ).toBe(true)
  }
})
test('the same installer recipes appear on Home, Examples and Docs with exact copying', async ({
  page,
  context
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  for (const path of ['./', 'docs/guides/examples/']) {
    await page.goto(path)
    const explorer = page.locator('.playground').first()
    for (const { label } of recipes) {
      await explorer.getByRole('tab', { name: label, exact: true }).click()
      const panel = explorer.getByRole('tabpanel', { name: label, exact: true })
      const frame = panel.locator('[data-copy-source]').first()
      const source = await frame.locator('code').textContent()
      expect(source).toContain('npx @samline/astro')
      await frame.getByRole('button').click()
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        source
      )
      await expect(frame.getByRole('button')).toContainText('Copied!')
    }
  }
})
test('gallery recipes explain location, outcome and next steps without copying a file tree as a command', async ({
  page,
  context
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('examples/')
  for (const recipe of recipes) {
    const section = page.locator(`#${recipe.id}`)
    await expect(section).toContainText(recipe.runFrom)
    await expect(section).toContainText(recipe.requires)
    await expect(section).toContainText(recipe.result)
    await expect(section).toContainText(recipe.nextStep)
    const frame = section.locator('[data-copy-source]:visible')
    await expect(frame).toHaveCount(1)
    await frame.getByRole('button').click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      recipe.command
    )
    await section.getByText(demoCopy.generated, { exact: true }).click()
    await expect(
      section.getByRole('group', {
        name: demoCopy.filesLabel
      })
    ).toContainText(recipe.files)
    await expect(
      section.getByRole('link', { name: demoCopy.guide })
    ).toHaveAttribute('href', project.docsBase + recipe.guide)
  }
  await page
    .getByRole('link', { name: landingCopy.examples.components, exact: true })
    .click()
  await expect(page.locator('h1')).toHaveText('Button')
})
test('production Pagefind search returns meaningful links in a compact top drawer', async ({
  page
}) => {
  await page.goto('docs/')
  await page
    .getByRole('button', { name: 'Search documentation', exact: true })
    .click()
  const input = page.getByRole('searchbox')
  await input.fill('configuration')
  await expect(
    page.getByRole('link', { name: /Configuration/ }).last()
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(input).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Search documentation', exact: true })
  ).toBeFocused()
})
test('mobile menu closes without moving the background and keeps docs last', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./#how')
  const before = await page.evaluate(() => scrollY)
  const trigger = page.getByRole('button', { name: 'Open navigation menu' })
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const links = page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .locator('.menu-link')
  await expect(links.last()).toHaveText(/Docs/)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - before)
  ).toBeLessThanOrEqual(1)
})
test('no JavaScript preserves content, code, alternative installs and mobile navigation', async ({
  browser
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 }
  })
  const page = await context.newPage()
  await page.goto(
    new URL(project.base, test.info().project.use.baseURL as string).href
  )
  await expect(page.locator('h1')).toBeVisible()
  await expect(
    page.locator('code').filter({ hasText: 'pnpm dlx' }).first()
  ).toBeVisible()
  await page.locator('.menu-fallback summary').click()
  await expect(
    page.getByRole('navigation', { name: 'Mobile navigation' })
  ).toBeVisible()
  await context.close()
})
test('all pages pass automated accessibility checks in both themes', async ({
  page
}) => {
  test.setTimeout(240000)
  const axe = await readFile(
    new URL('../node_modules/axe-core/axe.min.js', import.meta.url),
    'utf8'
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of paths) {
    await page.goto(path || './')
    await page.addScriptTag({ content: axe })
    for (const theme of ['dark', 'light']) {
      await page.evaluate(async (theme) => {
        document.documentElement.dataset.theme = theme
        await document.fonts.ready
        await Promise.all(
          document.getAnimations().map((a) => a.finished.catch(() => {}))
        )
      }, theme)
      const violations = await page.evaluate(async () => {
        const result = await (window as any).axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
          }
        })
        return result.violations.map((item: any) => ({
          id: item.id,
          nodes: item.nodes.map((n: any) => n.target)
        }))
      })
      expect(violations, `${path} ${theme}`).toEqual([])
    }
  }
})

test('ToC follows the clicked section and anchors retain the 2.5rem header gap', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 500 })
  await page.goto('docs/getting-started/')
  const nav = page
    .locator('.desktop-toc')
    .getByRole('navigation', { name: 'On this page' })
  const target = nav.getByRole('link', {
    name: 'Local package testing',
    exact: true
  })
  await target.click()
  await expect(target).toHaveAttribute('aria-current', 'location')
  const spacing = await page
    .locator('#local-package-testing')
    .evaluate((el) => ({
      gap:
        el.getBoundingClientRect().top -
        document
          .querySelector('package-site-docs-header')!
          .getBoundingClientRect().bottom,
      expected:
        parseFloat(getComputedStyle(document.documentElement).fontSize) * 2.5
    }))
  expect(Math.abs(spacing.gap - spacing.expected)).toBeLessThan(2)
})
