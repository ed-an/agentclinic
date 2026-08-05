import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', heading: 'AgentClinic' },
  { path: '/agents', heading: 'Agents' },
  { path: '/ailments', heading: 'Ailments' },
  { path: '/therapies', heading: 'Therapies' },
  { path: '/appointments', heading: 'Appointments' },
  { path: '/staff', heading: 'Staff' },
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
