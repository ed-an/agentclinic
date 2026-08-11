import { expect, test } from '@playwright/test';

const hydrationPattern = /hydration|did not match|server rendered html/i;

test('current application markup hydrates without mismatch warnings', async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (
      ['warning', 'error'].includes(message.type()) &&
      hydrationPattern.test(message.text())
    )
      warnings.push(message.text());
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'AgentClinic' }),
  ).toBeVisible();
  await page.waitForTimeout(250);
  expect(warnings).toEqual([]);
});

test('an externally injected body attribute does not break application hydration', async ({
  page,
}) => {
  await page.route('**/', async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({
      response,
      body: html.replace('<body', '<body data-extension-injected="true"'),
    });
  });
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (
      ['warning', 'error'].includes(message.type()) &&
      hydrationPattern.test(message.text())
    )
      warnings.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute(
    'data-extension-injected',
    'true',
  );
  await expect(
    page.getByRole('heading', { name: 'AgentClinic' }),
  ).toBeVisible();
  await page.waitForTimeout(250);
  expect(warnings).toEqual([]);
});
