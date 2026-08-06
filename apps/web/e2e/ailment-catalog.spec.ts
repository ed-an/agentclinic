import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const contextSwitchingFatigueId = '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40';

test('a visitor can search the catalog and open an ailment by keyboard', async ({
  page,
}) => {
  await page.goto('/ailments');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Ailments' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Complete catalog' }),
  ).toBeVisible();
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(4);

  const search = page.getByRole('searchbox', { name: 'Search ailments' });
  await search.focus();
  await expect(search).toBeFocused();
  await search.fill('FATIGUE');
  await page.getByRole('button', { name: 'Search' }).press('Enter');

  await expect(page).toHaveURL(/\/ailments\?q=FATIGUE$/);
  await expect(search).toHaveValue('FATIGUE');
  await expect(
    page.getByRole('heading', { name: 'Results for “FATIGUE”' }),
  ).toBeVisible();
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(1);

  const detailLink = page.getByRole('link', {
    name: 'Read about Context Switching Fatigue',
  });
  await detailLink.focus();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(
    new RegExp(`/ailments/${contextSwitchingFatigueId}$`),
  );
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Context Switching Fatigue',
    }),
  ).toBeVisible();
  await expect(page.getByText(/not a diagnosis/i)).toBeVisible();

  const backLink = page.getByRole('link', { name: /back to ailment catalog/i });
  await backLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/ailments$/);
});

test('a no-result search is distinct and can be cleared', async ({ page }) => {
  await page.goto('/ailments?q=missing');

  await expect(
    page.getByRole('heading', { name: 'No search results' }),
  ).toBeVisible();
  await expect(
    page.getByRole('searchbox', { name: 'Search ailments' }),
  ).toHaveValue('missing');
  await page.getByRole('link', { name: 'Clear search' }).click();
  await expect(page).toHaveURL(/\/ailments$/);
  await expect(
    page.getByRole('heading', { name: 'Complete catalog' }),
  ).toBeVisible();
});

test('an unknown Ailment has a clear not-found experience', async ({
  page,
}) => {
  await page.goto('/ailments/9e38c6a0-5f2d-4b79-a913-0d7e5c1b3a42');

  await expect(
    page.getByRole('heading', { name: 'Ailment not found' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Return to ailment catalog' }),
  ).toBeVisible();
});

for (const viewport of [
  { name: 'mobile and 400%-zoom equivalent', width: 320, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`Ailment states are responsive and accessible at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);

    for (const path of [
      '/ailments',
      '/ailments?q=overload',
      '/ailments?q=missing',
      `/ailments/${contextSwitchingFatigueId}`,
      '/ailments/9e38c6a0-5f2d-4b79-a913-0d7e5c1b3a42',
    ]) {
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
