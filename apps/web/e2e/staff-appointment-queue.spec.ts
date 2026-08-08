import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:3201';
const agentId = '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40';
const slotId = '9e5b2c70-ad43-4f98-8612-4b7e8a1d5f29';

test('staff filters, confirms, and cancels a pending request by keyboard', async ({
  page,
  request,
}) => {
  const booking = await request.post(`${apiUrl}/appointments`, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    data: {
      availabilitySlotId: slotId,
      agentId,
      visitorName: 'Staff Browser Private',
      visitorEmail: 'staff-browser@example.test',
    },
  });
  expect(booking.status()).toBe(201);
  const appointment = (await booking.json()) as { id: string };

  await page.goto('/staff/appointments');
  await expect(
    page.getByText('Unauthenticated demonstration access'),
  ).toBeVisible();
  await expect(page.getByText('staff-browser@example.test')).toHaveCount(0);
  await page.getByLabel('PENDING').check();
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(/status=PENDING/);
  await page.reload();
  await expect(page.getByText(appointment.id)).toBeVisible();
  let queueItem = page.locator('article').filter({ hasText: appointment.id });
  await queueItem.getByRole('button', { name: 'Confirm appointment' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Confirm Context Garden Walk?' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Confirm request' }).click();
  await expect(page.getByRole('status')).toContainText('is now confirmed');

  await page.getByRole('link', { name: 'Clear filters' }).click();
  queueItem = page.locator('article').filter({ hasText: appointment.id });
  await queueItem.getByRole('button', { name: 'Cancel appointment' }).click();
  await queueItem
    .getByLabel('Cancellation reason')
    .selectOption('SCHEDULE_CHANGE');
  await queueItem.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(page.getByRole('status')).toContainText('is now cancelled');
  const availability = await request.get(
    `${apiUrl}/therapies/1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41/availability`,
  );
  expect(
    ((await availability.json()) as Array<{ id: string }>).map(({ id }) => id),
  ).toContain(slotId);
  expect(await page.content()).not.toContain('staff-browser@example.test');
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(({ impact }) =>
      ['serious', 'critical'].includes(impact ?? ''),
    ),
  ).toEqual([]);
});

test('staff queue has no horizontal overflow at phone and desktop widths', async ({
  page,
}) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/staff/appointments?status=CANCELLED');
    await expect(
      page.getByRole('heading', { name: 'Staff appointment queue' }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});
