import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Slider } from './Slider';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('exposes itself as a switch with its label', () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Obligatorio" />);

    expect(screen.getByRole('switch', { name: /Obligatorio/ })).toBeInTheDocument();
  });

  it('reports the new state when clicked', async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Obligatorio" />);

    await userEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is toggleable from the keyboard', async () => {
    // The point of using a real checkbox rather than a styled div.
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Obligatorio" />);

    await userEvent.tab();
    await userEvent.keyboard(' ');

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not fire when disabled', async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Obligatorio" disabled />);

    await userEvent.click(screen.getByRole('switch'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('links its description for assistive tech', () => {
    render(
      <Toggle
        checked
        onChange={vi.fn()}
        label="Obligatorio"
        description="El comensal debe completar este campo."
      />,
    );

    expect(screen.getByRole('switch')).toHaveAccessibleDescription(
      'El comensal debe completar este campo.',
    );
  });
});

describe('Slider', () => {
  it('exposes itself as a labelled slider with its bounds', () => {
    render(<Slider value={10} onChange={vi.fn()} label="Margen de tolerancia" min={5} max={30} />);

    const slider = screen.getByRole('slider', { name: 'Margen de tolerancia' });
    expect(slider).toHaveValue('10');
    expect(slider).toHaveAttribute('min', '5');
    expect(slider).toHaveAttribute('max', '30');
  });

  it('reports the new value as a number, not the input string', () => {
    // fireEvent rather than userEvent: jsdom does not implement arrow-key
    // stepping on a range input, and the conversion is what matters here.
    const onChange = vi.fn();
    render(<Slider value={10} onChange={onChange} label="Margen" min={5} max={30} />);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '11' } });

    expect(onChange).toHaveBeenCalledWith(11);
  });

  it('renders the value label and description', () => {
    render(
      <Slider
        value={10}
        onChange={vi.fn()}
        label="Margen"
        valueLabel="10 min"
        description="Los turnos se marcarán como no-show después de este tiempo."
      />,
    );

    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAccessibleDescription(
      'Los turnos se marcarán como no-show después de este tiempo.',
    );
  });
});
