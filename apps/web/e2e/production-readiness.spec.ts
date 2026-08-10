import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signInPage } from './auth-helper';

test('authentication recovery, sign-out, focus, and accessibility remain safe', async ({
  page,
  context,
}) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('missing@example.test');
  await page.getByLabel('Password').fill('incorrect-but-nonempty');
  await page.getByRole('button', { name: 'Sign in' }).click();
  const signInError = page
    .getByRole('alert')
    .filter({ hasText: 'Email or password is incorrect.' });
  await expect(signInError).toBeFocused();
  await expect(signInError).toHaveText('Email or password is incorrect.');
  await expect(signInError).not.toContainText('missing@example.test');

  await signInPage(page, 'ada@demo.agentclinic.test');
  await expect(page.getByRole('link', { name: 'My dashboard' })).toBeVisible();
  await context.clearCookies();
  await page.goto('/agent/dashboard');
  await expect(page).toHaveURL(/\/sign-in\?returnTo=/);

  await signInPage(page, 'staff@demo.agentclinic.test');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/sign-in\?signedOut=true/);
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(({ impact }) =>
      ['serious', 'critical'].includes(impact ?? ''),
    ),
  ).toEqual([]);
});

test('production web and API responses enforce the approved header policy', async ({
  page,
  request,
}) => {
  const web = await request.get('/');
  const api = await request.get('http://127.0.0.1:3201/health/live');
  for (const response of [web, api]) {
    const headers = response.headers();
    expect(headers['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['permissions-policy']).toBeTruthy();
    expect(headers['x-powered-by']).toBeUndefined();
    expect(headers['strict-transport-security']).toBeUndefined();
  }
  expect(web.headers()['referrer-policy']).toBe(
    'strict-origin-when-cross-origin',
  );
  expect(api.headers()['referrer-policy']).toBe('no-referrer');
  expect(api.headers()['x-request-id']).toMatch(
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/,
  );

  await page.goto('/');
  const scriptSource = await page
    .locator('script[src]')
    .first()
    .getAttribute('src');
  expect(scriptSource).toBeTruthy();
  const asset = await request.get(scriptSource!);
  expect(asset.ok()).toBe(true);
  expect(asset.headers()['x-content-type-options']).toBe('nosniff');
});
