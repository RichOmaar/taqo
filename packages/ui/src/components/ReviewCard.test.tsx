import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReviewCard } from './ReviewCard';

describe('ReviewCard', () => {
  it('renders the reviewer, their words and the time', () => {
    render(
      <ReviewCard
        name="Mariana R."
        rating={5}
        feedback="El proceso fue súper fluido."
        timeLabel="Hace 10 min"
      />,
    );

    expect(screen.getByText('Mariana R.')).toBeInTheDocument();
    expect(screen.getByText(/El proceso fue súper fluido/)).toBeInTheDocument();
    expect(screen.getByText('Hace 10 min')).toBeInTheDocument();
  });

  it('states the rating in text, not only as stars', () => {
    // Shape alone is not an accessible encoding.
    render(<ReviewCard name="Jorge L." rating={4} />);

    expect(screen.getByText('4 de 5')).toBeInTheDocument();
  });

  it('renders without a comment, which the API allows', () => {
    render(<ReviewCard name="Sofía M." rating={5} feedback={null} />);

    expect(screen.getByText('Sofía M.')).toBeInTheDocument();
    expect(screen.queryByText(/“/)).not.toBeInTheDocument();
  });

  it('falls back to a placeholder initial for a blank name', () => {
    const { container } = render(<ReviewCard name="   " rating={3} />);

    expect(container.textContent).toContain('?');
  });
});
