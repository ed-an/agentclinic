import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

describe('shared state patterns', () => {
  it('renders accessible loading and empty states without axe violations', async () => {
    const { baseElement } = render(
      <main>
        <LoadingState />
        <EmptyState
          message="There is nothing waiting for you."
          title="All clear"
        />
      </main>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparing a calm space for you',
    );
    expect(
      screen.getByRole('heading', { name: 'All clear' }),
    ).toBeInTheDocument();

    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('announces errors and offers a working retry action', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    const { baseElement } = render(
      <main>
        <ErrorState onRetry={onRetry} />
      </main>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something interrupted your care',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();

    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
