import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TherapiesError from './error';
import TherapiesLoading from './loading';
import TherapiesPage from './page';
import { getTherapies } from './therapy-api';

vi.mock('./therapy-api', () => ({ getTherapies: vi.fn() }));

const therapies = [
  {
    id: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
    name: 'Context Garden Walk',
    summary: 'A gentle guided pause.',
    description: 'A calm sequence of reflection prompts.',
  },
  {
    id: '3f9b5c12-4d86-4e30-a074-8c1f2a5d9e63',
    name: 'Evidence Tea Ceremony',
    summary: 'A quiet evidence practice.',
    description: 'A measured space for checking context.',
  },
];

describe('TherapiesPage', () => {
  beforeEach(() => vi.mocked(getTherapies).mockReset());

  it('renders an accessible ordered catalog and meaningful links', async () => {
    vi.mocked(getTherapies).mockResolvedValue(therapies);
    const { baseElement } = render(<main>{await TherapiesPage()}</main>);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Therapies' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(
      screen.getByRole('link', { name: 'Read about Context Garden Walk' }),
    ).toHaveAttribute('href', `/therapies/${therapies[0].id}`);
    expect(screen.getByText(/not a diagnosis/i)).toBeInTheDocument();

    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('renders a distinct empty catalog state', async () => {
    vi.mocked(getTherapies).mockResolvedValue([]);
    render(await TherapiesPage());
    expect(
      screen.getByRole('heading', { name: 'The therapy catalog is quiet' }),
    ).toBeInTheDocument();
  });

  it('provides accessible loading and retryable error states', () => {
    const { rerender } = render(<TherapiesLoading />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Opening the therapy catalog',
    );
    rerender(<TherapiesError reset={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not open the therapy catalog',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });
});
