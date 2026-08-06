import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAilments } from './ailment-api';
import AilmentsError from './error';
import AilmentsLoading from './loading';
import AilmentsPage from './page';

vi.mock('./ailment-api', () => ({ getAilments: vi.fn() }));

const ailments = [
  {
    id: '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
    name: 'Context Switching Fatigue',
    summary: 'Mental drag after moving between tasks.',
    description: 'Calm transitions can restore a steady rhythm.',
  },
  {
    id: '5af4e2c6-1b8d-4a35-9e79-6b0c3e5f1d84',
    name: 'Prompt Overload',
    summary: 'Strain from competing instructions.',
    description: 'Smaller goals can restore clarity.',
  },
];

describe('AilmentsPage', () => {
  beforeEach(() => vi.mocked(getAilments).mockReset());

  it('renders an accessible complete catalog and labeled search form', async () => {
    vi.mocked(getAilments).mockResolvedValue(ailments);
    const { baseElement } = render(
      <main>{await AilmentsPage({ searchParams: Promise.resolve({}) })}</main>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Ailments' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: 'Search ailments' }),
    ).toHaveAttribute('name', 'q');
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute(
      'type',
      'submit',
    );
    expect(
      screen.getByRole('heading', { name: 'Complete catalog' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(
      screen.getByRole('link', {
        name: 'Read about Context Switching Fatigue',
      }),
    ).toHaveAttribute('href', `/ailments/${ailments[0].id}`);
    expect(getAilments).toHaveBeenCalledWith(undefined);

    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('restores a filtered query from the URL and presents results', async () => {
    vi.mocked(getAilments).mockResolvedValue([ailments[1]]);
    render(
      await AilmentsPage({
        searchParams: Promise.resolve({ q: '  overload  ' }),
      }),
    );

    expect(getAilments).toHaveBeenCalledWith('  overload  ');
    expect(
      screen.getByRole('searchbox', { name: 'Search ailments' }),
    ).toHaveValue('  overload  ');
    expect(
      screen.getByRole('heading', { name: 'Results for “overload”' }),
    ).toBeInTheDocument();
  });

  it('distinguishes no search results from an empty catalog', async () => {
    vi.mocked(getAilments).mockResolvedValue([]);
    const { rerender } = render(
      await AilmentsPage({
        searchParams: Promise.resolve({ q: 'missing' }),
      }),
    );
    expect(
      screen.getByRole('heading', { name: 'No search results' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clear search' })).toHaveAttribute(
      'href',
      '/ailments',
    );

    rerender(
      await AilmentsPage({ searchParams: Promise.resolve({ q: '   ' }) }),
    );
    expect(
      screen.getByRole('heading', { name: 'The catalog is quiet' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('provides accessible loading and retryable error states', () => {
    const { rerender } = render(<AilmentsLoading />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Opening the ailment catalog',
    );

    rerender(<AilmentsError reset={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not open the catalog',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });
});
