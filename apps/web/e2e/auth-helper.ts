import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:3201';

function password(): string {
  const value = process.env.AGENTCLINIC_E2E_PASSWORD;
  if (!value)
    throw new Error('The isolated browser credential was not provisioned.');
  return value;
}

export async function signInPage(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password());
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => url.pathname !== '/sign-in');
}

export async function signInApi(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  const response = await request.post(`${apiUrl}/auth/sign-in`, {
    headers: { origin: 'http://127.0.0.1:3200' },
    data: { email, password: password() },
  });
  expect(response.status()).toBe(200);
  return ((await response.json()) as { csrfToken: string }).csrfToken;
}
