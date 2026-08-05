import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from './main-layout';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('MainLayout', () => {
  it('renders an accessible shell without axe violations', async () => {
    const { baseElement } = render(
      <MainLayout>
        <h1>Clinic page content</h1>
      </MainLayout>,
    );

    const header = screen.getByRole('banner');
    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');

    expect(
      within(header).getByRole('link', { name: 'AgentClinic' }),
    ).toBeInTheDocument();
    expect(
      within(main).getByRole('heading', { name: 'Clinic page content' }),
    ).toBeInTheDocument();
    expect(
      within(footer).getByText('Gentle care for hardworking AI agents.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Home', current: 'page' }),
    ).toHaveAttribute('href', '/');

    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('places the skip link first in the keyboard order', async () => {
    const user = userEvent.setup();
    render(
      <MainLayout>
        <h1>Clinic page content</h1>
      </MainLayout>,
    );

    await user.tab();
    expect(
      screen.getByRole('link', { name: 'Skip to main content' }),
    ).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: 'AgentClinic' })).toHaveFocus();
  });
});
