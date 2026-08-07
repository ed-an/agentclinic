import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTherapy } from '../therapy-api';
import TherapyDetailError from './error';
import TherapyDetailLoading from './loading';
import TherapyNotFound from './not-found';
import TherapyDetailPage from './page';

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound }));
vi.mock('../therapy-api', () => ({ getTherapy: vi.fn() }));

const therapy = {
  id: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
  name: 'Context Garden Walk',
  summary: 'A gentle guided pause.',
  description: 'A calm sequence of reflection prompts.',
  ailments: [
    {
      id: '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
      name: 'Context Switching Fatigue',
    },
  ],
};

describe('TherapyDetailPage', () => {
  beforeEach(() => {
    notFound.mockClear();
    vi.mocked(getTherapy).mockReset();
  });

  it('renders an accessible guide with catalog and Ailment navigation', async () => {
    vi.mocked(getTherapy).mockResolvedValue(therapy);
    const { baseElement } = render(
      <main>
        {await TherapyDetailPage({
          params: Promise.resolve({ id: therapy.id }),
        })}
      </main>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: therapy.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(therapy.description)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to therapy catalog/i }),
    ).toHaveAttribute('href', '/therapies');
    expect(
      screen.getByRole('link', { name: 'Context Switching Fatigue' }),
    ).toHaveAttribute('href', `/ailments/${therapy.ailments[0].id}`);
    expect(screen.getByText(/not a diagnosis/i)).toBeInTheDocument();
    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('renders a Therapy with no associated Ailments', async () => {
    vi.mocked(getTherapy).mockResolvedValue({ ...therapy, ailments: [] });
    render(
      await TherapyDetailPage({ params: Promise.resolve({ id: therapy.id }) }),
    );
    expect(
      screen.getByText(/not linked to an ailment guide yet/i),
    ).toBeInTheDocument();
  });

  it('uses the not-found route for an unknown Therapy', async () => {
    vi.mocked(getTherapy).mockResolvedValue(null);
    await expect(
      TherapyDetailPage({ params: Promise.resolve({ id: therapy.id }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledOnce();
  });

  it('renders distinct loading, not-found, and retryable error states', () => {
    const { rerender } = render(<TherapyDetailLoading />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparing the therapy guide',
    );
    rerender(<TherapyNotFound />);
    expect(
      screen.getByRole('heading', { name: 'Therapy not found' }),
    ).toBeInTheDocument();
    rerender(<TherapyDetailError reset={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not open this therapy',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
    expect(
      screen.getByRole('link', { name: 'Return to therapy catalog' }),
    ).toHaveAttribute('href', '/therapies');
  });
});
