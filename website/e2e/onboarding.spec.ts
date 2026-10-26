import { test, expect } from '@playwright/test'
import sections from '../landing/src/i18n/translations/en/sections'

test('Home onboarding links to factual local package testing before npm publication', async ({
  page
}) => {
  await page.goto('./')
  await page
    .locator('#how')
    .getByRole('link', { name: sections.gettingStarted.integrationLabel })
    .click()
  await expect(page.locator('#local-package-testing')).toBeVisible()
  await expect(page.locator('main')).toContainText('npm exec --yes --package')
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
