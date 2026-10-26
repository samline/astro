import { test, expect } from '@playwright/test'
import sections from '../landing/src/i18n/translations/en/sections'
import { managers, tasks } from '../shared/i18n/translations/en/tooling'

test('FAQs are keyboard disclosures with useful guide destinations, including without JavaScript', async ({
  page,
  browser
}) => {
  await page.goto('./')
  const items = page.locator('#faq details')
  await expect(items).toHaveCount(Object.keys(sections.faq.items).length)
  for (const item of await items.all()) {
    const summary = item.locator('summary')
    await summary.focus()
    await summary.press('Enter')
    await expect(item).toHaveAttribute('open', '')
    const guide = item.getByRole('link')
    await expect(guide).toBeVisible()
    const response = await page.request.get((await guide.getAttribute('href'))!)
    expect(response.ok()).toBe(true)
    await summary.press('Enter')
    await expect(item).not.toHaveAttribute('open', '')
  }
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const plain = await context.newPage()
    await plain.goto(new URL('./', page.url()).href)
    const first = plain.locator('#faq details').first()
    await first.locator('summary').click()
    await expect(first.getByRole('link')).toBeVisible()
  } finally {
    await context.close()
  }
})

test('landing, Examples and Docs share the current copyright credit', async ({
  page
}) => {
  for (const route of ['./', 'examples/', 'docs/']) {
    await page.goto(route)
    await expect(page.locator('footer')).toContainText(
      `© ${new Date().getFullYear()} Samuel Olvera · Made for the open web.`
    )
  }
})

test('project command tabs switch and copy the exact selected command', async ({
  page,
  context
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('docs/getting-started/')
  for (const [group, task] of [
    ['docs-run-tools', 'run'],
    ['docs-dependency-tools', 'install']
  ] as const) {
    const tabs = page.locator(`package-site-tabs[data-group="${group}"]`)
    for (const [index, manager] of managers.entries()) {
      await tabs.getByRole('tab', { name: manager.label, exact: true }).click()
      const panel = tabs.getByRole('tabpanel')
      await expect(panel.locator('code')).toHaveText(
        tasks[task].commands[index]
      )
      await panel.getByRole('button').click()
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        tasks[task].commands[index]
      )
    }
  }
  await page.goto('docs/guides/integrations/')
  const commands = page.locator('main package-site-tabs').first()
  await commands.getByRole('tab', { name: 'Bun', exact: true }).click()
  await expect(commands.getByRole('tabpanel')).toContainText(
    'bunx @samline/astro add'
  )
})

test('package card copy stays visible with enlarged text on a narrow viewport', async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('./')
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  const clipped = await page.locator('.package-copy').evaluateAll((elements) =>
    elements.flatMap((element) => {
      const bounds = element.closest('.package-card')!.getBoundingClientRect()
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      const failures = []
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent?.trim()) continue
        const range = document.createRange()
        range.selectNodeContents(walker.currentNode)
        if (
          [...range.getClientRects()].some(
            (rect) =>
              rect.width > 0 &&
              (rect.left < bounds.left || rect.right > bounds.right)
          )
        )
          failures.push(walker.currentNode.textContent)
      }
      return failures
    })
  )
  expect(clipped).toEqual([])
})
