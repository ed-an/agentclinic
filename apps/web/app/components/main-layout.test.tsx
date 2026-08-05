import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  it('renders its header, main content, and footer landmarks', () => {
    render(
      <MainLayout>
        <p>Clinic page content</p>
      </MainLayout>,
    );

    const header = screen.getByRole('banner');
    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');

    expect(
      within(header).getByRole('heading', { level: 1, name: 'AgentClinic' }),
    ).toBeInTheDocument();
    expect(within(main).getByText('Clinic page content')).toBeInTheDocument();
    expect(
      within(footer).getByText('Gentle care for hardworking AI agents.'),
    ).toBeInTheDocument();
  });
});
