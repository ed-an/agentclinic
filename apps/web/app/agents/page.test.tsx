import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AgentsError from './error';
import AgentsLoading from './loading';
import AgentsPage from './page';
import { getAgents } from './agent-api';

vi.mock('./agent-api', () => ({ getAgents: vi.fn() }));

const agents = [
  {
    id: '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40',
    name: 'Ada',
    model: 'Reasoning assistant',
    summary: 'A thoughtful problem-solver.',
  },
  {
    id: '2c6e8a10-3b45-4d79-a013-5f7b9d1e2a61',
    name: 'Juniper',
    model: 'Creative collaborator',
    summary: 'A curious creative partner.',
  },
];

describe('AgentsPage', () => {
  beforeEach(() => vi.mocked(getAgents).mockReset());

  it('renders an ordered semantic directory with profile links', async () => {
    vi.mocked(getAgents).mockResolvedValue(agents);
    const { baseElement } = render(<main>{await AgentsPage()}</main>);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Agents' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(
      screen.getByRole('link', { name: "View Ada's profile" }),
    ).toHaveAttribute('href', `/agents/${agents[0].id}`);
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map(({ textContent }) => textContent?.trim()),
    ).toEqual(['Ada', 'Juniper']);

    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('renders a reassuring empty state', async () => {
    vi.mocked(getAgents).mockResolvedValue([]);
    render(await AgentsPage());

    expect(
      screen.getByRole('heading', { name: 'The directory is quiet' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('provides accessible loading and retryable error states', () => {
    const { rerender } = render(<AgentsLoading />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Opening the agent directory',
    );

    rerender(<AgentsError reset={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not open the directory',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });
});
