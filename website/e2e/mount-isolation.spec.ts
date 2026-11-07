import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = ts.transpileModule(
  await readFile(
    new URL('../shared/lib/mount-elements.ts', import.meta.url),
    'utf8'
  ),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext
    }
  }
).outputText

test('one failed shared setup leaves later and dynamically added instances usable', async ({
  page
}) => {
  await page.goto('./')
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.evaluate(async (source) => {
    const { mountElements } = await import(
      'data:text/javascript;base64,' + btoa(source)
    )
    const container = document.createElement('div')
    container.innerHTML =
      '<div data-mount-probe="bad"></div><div data-mount-probe="good"></div>'
    document.body.append(container)
    mountElements('[data-mount-probe]', (element: HTMLElement) => {
      if (element.dataset.mountProbe === 'bad')
        throw new Error('Expected isolated setup failure')
      element.dataset.probeReady = 'true'
      return () => {
        delete element.dataset.probeReady
      }
    })
    const added = document.createElement('div')
    added.dataset.mountProbe = 'added'
    container.append(added)
  }, source)
  await expect(page.locator('[data-mount-probe="good"]')).toHaveAttribute(
    'data-probe-ready',
    'true'
  )
  await expect(page.locator('[data-mount-probe="added"]')).toHaveAttribute(
    'data-probe-ready',
    'true'
  )
  expect(
    errors.filter((message) =>
      message.includes('mountElements([data-mount-probe]) setup failed')
    )
  ).toHaveLength(1)
})
