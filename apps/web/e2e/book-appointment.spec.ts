import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const slotId = 'd29f60b8-e187-43d7-8a50-8f1c2e5b9d63';

test('visitor completes and refreshes a private booking by keyboard', async ({
  page,
}) => {
  await page.goto(`/appointments/book?slotId=${slotId}`);
  await expect(
    page.getByRole('heading', { name: 'Book an appointment' }),
  ).toBeVisible();
  await page.getByLabel('Agent').selectOption({ index: 1 });
  await page.getByLabel('Your name').fill('Browser Visitor');
  await page.getByLabel('Your email').fill('browser@example.test');
  await page.getByRole('button', { name: 'Review booking' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Review your booking' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Confirm booking' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Your appointment is confirmed' }),
  ).toBeVisible();
  await expect(page.getByText('browser@example.test')).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Your appointment is confirmed' }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(({ impact }) =>
      ['serious', 'critical'].includes(impact ?? ''),
    ),
  ).toEqual([]);
});

test('booking validation, malformed context, and responsive reflow are safe', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(`/appointments/book?slotId=${slotId}`);
  await page.getByRole('button', { name: 'Review booking' }).click();
  await expect(
    page.getByText('Choose an Agent and enter a valid name and email.'),
  ).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await page.goto('/appointments/book?slotId=not-a-uuid');
  await expect(
    page.getByRole('heading', { name: 'Invalid availability reference' }),
  ).toBeVisible();
});
