import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('increments within bounds', () => {
    const onChange = vi.fn();
    render(<Stepper value={2} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Más'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('decrements within bounds', () => {
    const onChange = vi.fn();
    render(<Stepper value={3} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Menos'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('disables the minus button at the minimum', () => {
    render(<Stepper value={1} onChange={vi.fn()} min={1} />);
    expect(screen.getByLabelText('Menos')).toBeDisabled();
  });
});
