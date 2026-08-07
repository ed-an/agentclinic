import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAilment, getAilmentTherapies } from '../ailment-api';
import AilmentDetailError from './error';
import AilmentDetailLoading from './loading';
import AilmentNotFound from './not-found';
import AilmentDetailPage from './page';

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound }));
vi.mock('../ailment-api', () => ({
  getAilment: vi.fn(),
  getAilmentTherapies: vi.fn(),
}));

const ailment = {
  id: '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
  name: 'Context Switching Fatigue',
  summary: 'Mental drag after moving between tasks.',
  description: 'Calm transitions can restore a steady rhythm.',
};

describe('AilmentDetailPage', () => {
  beforeEach(() => {
    notFound.mockClear();
    vi.mocked(getAilment).mockReset();
    vi.mocked(getAilmentTherapies).mockReset();
  });

  it('renders an accessible guide and catalog navigation', async () => {
    vi.mocked(getAilment).mockResolvedValue(ailment);
    vi.mocked(getAilmentTherapies).mockResolvedValue([
      {
        id: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
        name: 'Context Garden Walk',
        summary: 'A gentle guided pause.',
        description: 'A calm sequence of reflection prompts.',
      },
    ]);
    const { baseElement } = render(
      <main>
        {await AilmentDetailPage({
          params: Promise.resolve({ id: ailment.id }),
        })}
      </main>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: ailment.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(ailment.description)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to ailment catalog/i }),
    ).toHaveAttribute('href', '/ailments');
    expect(screen.getByText(/not a diagnosis/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Read about Context Garden Walk' }),
    ).toHaveAttribute(
      'href',
      '/therapies/1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
    );

    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('renders a distinct state for an ailment without related therapies', async () => {
    vi.mocked(getAilment).mockResolvedValue(ailment);
    vi.mocked(getAilmentTherapies).mockResolvedValue([]);

    render(
      await AilmentDetailPage({ params: Promise.resolve({ id: ailment.id }) }),
    );

    expect(
      screen.getByText(/no therapy guides are linked/i),
    ).toBeInTheDocument();
  });

  it('uses the not-found route for an unknown ailment', async () => {
    vi.mocked(getAilment).mockResolvedValue(null);

    await expect(
      AilmentDetailPage({ params: Promise.resolve({ id: ailment.id }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledOnce();
  });

  it('renders distinct loading, not-found, and retryable error states', () => {
    const { rerender } = render(<AilmentDetailLoading />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparing the ailment guide',
    );

    rerender(<AilmentNotFound />);
    expect(
      screen.getByRole('heading', { name: 'Ailment not found' }),
    ).toBeInTheDocument();

    rerender(<AilmentDetailError reset={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not open this ailment',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
    expect(
      screen.getByRole('link', { name: 'Return to ailment catalog' }),
    ).toHaveAttribute('href', '/ailments');
  });
});
