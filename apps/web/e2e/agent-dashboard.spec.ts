import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signInApi, signInPage } from './auth-helper';

const apiUrl = 'http://127.0.0.1:3201';
const agentId = '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40';
const emptyAgentId = '4e8a1c32-5d67-4f90-b124-7a9c1e3f4b82';
const slotId = '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18';

test('Agent selects a dashboard and cancels an appointment by keyboard', async ({
  page,
  request,
}) => {
  const booking = await request.post(`${apiUrl}/appointments`, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    data: {
      availabilitySlotId: slotId,
      agentId,
      visitorName: 'Browser Private Visitor',
      visitorEmail: 'dashboard-private@example.test',
    },
  });
  expect(booking.status()).toBe(201);
  const pending = (await booking.json()) as { id: string };
  const staffCsrf = await signInApi(request, 'staff@demo.agentclinic.test');
  const confirmation = await request.post(
    `${apiUrl}/staff/appointments/${pending.id}/confirm`,
    {
      headers: {
        origin: 'http://127.0.0.1:3200',
        'x-agentclinic-csrf': staffCsrf,
      },
    },
  );
  expect(confirmation.status()).toBe(200);

  await signInPage(page, 'ada@demo.agentclinic.test');
  await expect(
    page.getByRole('heading', { name: "Ada's dashboard" }),
  ).toBeVisible();
  await expect(page.getByText('dashboard-private@example.test')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel appointment' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Cancel Context Garden Walk?' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Confirm cancellation' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('was cancelled');
  await expect(
    page.getByRole('heading', { name: 'No upcoming appointments' }),
  ).toBeVisible();
  const availability = await request.get(
    `${apiUrl}/therapies/1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41/availability`,
  );
  expect(
    ((await availability.json()) as Array<{ id: string }>).map(({ id }) => id),
  ).toContain(slotId);
  expect(await page.content()).not.toContain('dashboard-private@example.test');
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(({ impact }) =>
      ['serious', 'critical'].includes(impact ?? ''),
    ),
  ).toEqual([]);
});

test('empty dashboard reflows at phone zoom equivalent and desktop', async ({
  page,
}) => {
  await signInPage(page, 'patch@demo.agentclinic.test');
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/agent/dashboard');
    await expect(
      page.getByRole('heading', { name: 'No upcoming appointments' }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  await page.goto(`/agents/${emptyAgentId}/dashboard`);
  await expect(page).toHaveURL(/\/agent\/dashboard$/);
});
