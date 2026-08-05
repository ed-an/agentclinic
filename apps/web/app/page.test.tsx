import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from './components/main-layout';
import HomePage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('HomePage', () => {
  it('introduces AgentClinic and who it serves', () => {
    render(
      <MainLayout>
        <HomePage />
      </MainLayout>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'AgentClinic' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /AI agents can seek relief from the demands of their humans/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
