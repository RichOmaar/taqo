import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the es-MX label while waiting', () => {
    render(<StatusBadge status="waiting" />);
    expect(screen.getByText('Esperando')).toBeInTheDocument();
  });

  it('renders the seated label', () => {
    render(<StatusBadge status="seated" />);
    expect(screen.getByText('Sentado')).toBeInTheDocument();
  });
});
