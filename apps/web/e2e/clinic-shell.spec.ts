import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signInPage } from './auth-helper';

const routes = [
  { path: '/', heading: 'AgentClinic' },
  { path: '/agents', heading: 'Agents' },
  { path: '/ailments', heading: 'Ailments' },
  { path: '/therapies', heading: 'Therapies' },
  { path: '/appointments', heading: 'Appointments' },
  { path: '/sign-in', heading: 'Sign in' },
] as const;

for (const route of routes) {
  test(`${route.heading} has no serious accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route.path);

    await expect(
      page.getByRole('heading', { level: 1, name: route.heading }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blockingViolations = results.violations.filter(({ impact }) =>
      ['serious', 'critical'].includes(impact ?? ''),
    );

    expect(blockingViolations).toEqual([]);
  });
}

test('appointments directs visitors to booking and account actions', async ({
  page,
}) => {
  await page.goto('/appointments');

  await expect(
    page.getByRole('heading', { name: 'Book an appointment' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Browse therapies' }),
  ).toHaveAttribute('href', '/therapies');
  await expect(
    page.getByRole('link', { name: 'Sign in', exact: true }).last(),
  ).toHaveAttribute('href', '/sign-in?returnTo=%2Fappointments');
  await expect(page.getByText('Appointments will be ready soon')).toHaveCount(
    0,
  );
});

test('appointments directs Agents to their dashboard', async ({ page }) => {
  await signInPage(page, 'ada@demo.agentclinic.test');
  await page.goto('/appointments');

  await expect(
    page.getByRole('link', { name: 'Open my dashboard' }),
  ).toHaveAttribute('href', '/agent/dashboard');
});

test('appointments directs Staff to their queue', async ({ page }) => {
  await signInPage(page, 'staff@demo.agentclinic.test');
  await page.goto('/appointments');

  await expect(
    page.getByRole('link', { name: 'Open staff queue' }),
  ).toHaveAttribute('href', '/staff/appointments');
});

test('keyboard users can skip to content and navigate between areas', async ({
  page,
}) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to main content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'AgentClinic' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Home', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Agents' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/agents$/);
  await expect(page.getByRole('link', { name: 'Agents' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

for (const viewport of [
  { name: 'phone', width: 320, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`shell has no horizontal overflow at the ${viewport.name} viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/appointments');

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
}
