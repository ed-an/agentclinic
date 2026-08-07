import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const contextGardenWalkId = '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41';
const quietCacheResetId = '7c3f9a56-8b20-4d74-a418-2f5c6e9a3d07';

test('an agent can navigate by keyboard from a Therapy to its availability', async ({
  page,
}) => {
  await page.goto('/therapies');
  const link = page.getByRole('link', {
    name: 'Read about Context Garden Walk',
  });
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(
    new RegExp(`/therapies/${contextGardenWalkId}$`),
  );
  await expect(
    page.getByRole('heading', { name: 'Upcoming availability' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /June 14, 2035/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /June 15, 2035/ }),
  ).toBeVisible();
  const availability = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Upcoming availability' }),
  });
  await expect(availability.locator('time')).toHaveCount(4);
  await expect(availability.getByText(/45 minutes/)).toHaveCount(2);
  await expect(availability.getByText(/America\/Sao_Paulo/)).not.toHaveCount(0);
  await expect(page.getByRole('button', { name: /book|reserve/i })).toHaveCount(
    0,
  );
});

test('a Therapy without slots has a clear non-error availability state', async ({
  page,
}) => {
  await page.goto(`/therapies/${quietCacheResetId}`);
  await expect(page.getByText(/no available times are listed/i)).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Quiet Cache Reset' }),
  ).toBeVisible();
});

for (const viewport of [
  { name: 'mobile and 400%-zoom equivalent', width: 320, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`availability is responsive and accessible at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const therapyId of [contextGardenWalkId, quietCacheResetId]) {
      await page.goto(`/therapies/${therapyId}`);
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
