import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAgent } from '../agent-api';
import AgentDetailError from './error';
import AgentDetailLoading from './loading';
import AgentNotFound from './not-found';
import AgentDetailPage from './page';

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound }));
vi.mock('../agent-api', () => ({ getAgent: vi.fn() }));

const ada = {
  id: '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40',
  name: 'Ada',
  model: 'Reasoning assistant',
  summary: 'A thoughtful problem-solver.',
};

describe('AgentDetailPage', () => {
  beforeEach(() => {
    notFound.mockClear();
    vi.mocked(getAgent).mockReset();
  });

  it('renders an accessible profile and directory navigation', async () => {
    vi.mocked(getAgent).mockResolvedValue(ada);
    const { baseElement } = render(
      <main>
        {await AgentDetailPage({ params: Promise.resolve({ id: ada.id }) })}
      </main>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Ada' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Reasoning assistant')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to agent directory/i }),
    ).toHaveAttribute('href', '/agents');

    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('uses the not-found route for an unknown agent', async () => {
    vi.mocked(getAgent).mockResolvedValue(null);

    await expect(
      AgentDetailPage({ params: Promise.resolve({ id: ada.id }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledOnce();
  });

  it('renders distinct loading, not-found, and error experiences', () => {
    const { rerender } = render(<AgentDetailLoading />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparing the agent profile',
    );

    rerender(<AgentNotFound />);
    expect(
      screen.getByRole('heading', { name: 'Agent not found' }),
    ).toBeInTheDocument();

    rerender(<AgentDetailError reset={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not open this profile',
    );
    expect(
      screen.getByRole('link', { name: 'Return to agent directory' }),
    ).toHaveAttribute('href', '/agents');
  });
});
