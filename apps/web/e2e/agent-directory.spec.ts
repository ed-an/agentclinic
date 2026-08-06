import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const adaId = '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40';

test('staff can navigate the Agent directory and profile by keyboard', async ({
  page,
}) => {
  await page.goto('/agents');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Agents' }),
  ).toBeVisible();
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(3);
  await expect(
    page.getByRole('heading', { level: 2 }).allTextContents(),
  ).resolves.toEqual(['Ada', 'Juniper', 'Patch']);

  const profileLink = page.getByRole('link', { name: "View Ada's profile" });
  await profileLink.focus();
  await expect(profileLink).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(new RegExp(`/agents/${adaId}$`));
  await expect(
    page.getByRole('heading', { level: 1, name: 'Ada' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Agents' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  const backLink = page.getByRole('link', { name: /back to agent directory/i });
  await backLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/agents$/);
});

test('an unknown Agent has a clear not-found experience', async ({ page }) => {
  await page.goto('/agents/8f0e2d4c-6b8a-4c12-9345-7d9e1f3a5b60');

  await expect(
    page.getByRole('heading', { name: 'Agent not found' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Return to agent directory' }),
  ).toBeVisible();
});

for (const viewport of [
  { name: 'mobile', width: 320, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`Agent pages are responsive and accessible at ${viewport.name} size`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);

    for (const path of ['/agents', `/agents/${adaId}`]) {
      await page.goto(path);
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.filter(({ impact }) =>
          ['serious', 'critical'].includes(impact ?? ''),
        ),
      ).toEqual([]);
    }
  });
}
