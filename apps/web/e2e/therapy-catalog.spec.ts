import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const contextSwitchingFatigueId = '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40';
const tokenTensionId = '7c16a4e8-3d0f-4c57-b091-8d2e5a7f3b06';
const contextGardenWalkId = '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41';
const quietCacheResetId = '7c3f9a56-8b20-4d74-a418-2f5c6e9a3d07';
const unknownId = '9e38c6a0-5f2d-4b79-a913-0d7e5c1b3a42';

test('a visitor can browse the Therapy catalog and detail by keyboard', async ({
  page,
}) => {
  await page.goto('/therapies');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Therapies' }),
  ).toBeVisible();
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(4);

  const detailLink = page.getByRole('link', {
    name: 'Read about Context Garden Walk',
  });
  await detailLink.focus();
  await expect(detailLink).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(
    new RegExp(`/therapies/${contextGardenWalkId}$`),
  );
  await expect(
    page.getByRole('heading', { level: 1, name: 'Context Garden Walk' }),
  ).toBeVisible();
  await expect(page.getByText(/not a diagnosis/i)).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Context Switching Fatigue' }),
  ).toHaveAttribute('href', `/ailments/${contextSwitchingFatigueId}`);

  const backLink = page.getByRole('link', {
    name: /back to therapy catalog/i,
  });
  await backLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/therapies$/);
});

test('an agent can follow associated Therapies from an Ailment', async ({
  page,
}) => {
  await page.goto(`/ailments/${contextSwitchingFatigueId}`);

  const relatedHeading = page.getByRole('heading', {
    name: 'Related therapy information',
  });
  await expect(relatedHeading).toBeVisible();
  const section = page.locator('section').filter({ has: relatedHeading });
  await expect(section.getByRole('listitem')).toHaveCount(2);

  const therapyLink = section.getByRole('link', {
    name: 'Read about Prompt Sorting Session',
  });
  await therapyLink.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Prompt Sorting Session' }),
  ).toBeVisible();
});

test('empty relationships and unknown Therapies have distinct states', async ({
  page,
}) => {
  await page.goto(`/ailments/${tokenTensionId}`);
  await expect(page.getByText(/no therapy guides are linked/i)).toBeVisible();

  await page.goto(`/therapies/${quietCacheResetId}`);
  await expect(
    page.getByText(/not linked to an ailment guide yet/i),
  ).toBeVisible();

  await page.goto(`/therapies/${unknownId}`);
  await expect(
    page.getByRole('heading', { name: 'Therapy not found' }),
  ).toBeVisible();
});

for (const viewport of [
  { name: 'mobile and 400%-zoom equivalent', width: 320, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`Therapy states are responsive and accessible at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);

    for (const path of [
      '/therapies',
      `/therapies/${contextGardenWalkId}`,
      `/therapies/${quietCacheResetId}`,
      `/therapies/${unknownId}`,
      `/ailments/${contextSwitchingFatigueId}`,
      `/ailments/${tokenTensionId}`,
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
