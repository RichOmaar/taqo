import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { chart as chartTokens } from '../tokens';
import { GroupedBarChart } from './GroupedBarChart';
import { Heatmap } from './Heatmap';
import { columnPath, niceTicks, rampIndex, tickIndices } from './primitives';

describe('columnPath', () => {
  it('rounds the data end and squares the baseline', () => {
    const path = columnPath(0, 10, 20, 40);

    // Starts at the baseline corner and curves only at the top.
    expect(path.startsWith('M0,50')).toBe(true);
    expect(path).toContain('Q');
    expect(path.endsWith('Z')).toBe(true);
  });

  it('draws nothing for a zero-height column', () => {
    expect(columnPath(0, 10, 20, 0)).toBe('');
  });

  it('never rounds more than the column can take', () => {
    // A 2px-tall bar with a 4px radius would otherwise invert the curve.
    expect(columnPath(0, 0, 20, 2)).not.toContain('NaN');
  });
});

describe('rampIndex', () => {
  it('returns -1 for no activity, which is not the palest step', () => {
    // "Nobody came" is a different fact from "a few people came".
    expect(rampIndex(0, 10, 4)).toBe(-1);
  });

  it('gives any non-zero value at least the first step', () => {
    expect(rampIndex(1, 100, 4)).toBe(0);
  });

  it('gives the busiest cell the darkest step', () => {
    expect(rampIndex(10, 10, 4)).toBe(3);
  });

  it('increases monotonically with value', () => {
    const steps = [1, 3, 5, 7, 9, 10].map((value) => rampIndex(value, 10, 4));

    expect(steps).toEqual([...steps].sort((a, b) => a - b));
  });

  it('handles an empty grid without dividing by zero', () => {
    expect(rampIndex(0, 0, 4)).toBe(-1);
  });
});

describe('niceTicks', () => {
  it('starts at zero so bar lengths stay proportional', () => {
    expect(niceTicks(10)[0]).toBe(0);
  });

  it('covers the highest value, so no bar draws past the top', () => {
    for (const highest of [1, 4, 7, 10, 17, 23, 99, 137]) {
      const ticks = niceTicks(highest);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(highest);
    }
  });

  it('steps on round numbers', () => {
    expect(niceTicks(10)).toEqual([0, 5, 10]);
    expect(niceTicks(17)).toEqual([0, 5, 10, 15, 20]);
  });

  it('uses whole numbers for small counts', () => {
    expect(niceTicks(4)).toEqual([0, 1, 2, 3, 4]);
  });

  it('degrades to a single tick with no data', () => {
    expect(niceTicks(0)).toEqual([0]);
  });
});

describe('tickIndices', () => {
  it('keeps every index at stride 1', () => {
    expect(tickIndices(4, 1)).toEqual([0, 1, 2, 3]);
  });

  it('thins dense axes but always keeps the first', () => {
    expect(tickIndices(24, 3)).toEqual([0, 3, 6, 9, 12, 15, 18, 21]);
  });
});

const CATEGORIES = ['12:00', '13:00', '14:00'];
const SERIES = [
  { key: 'joined', label: 'Se anotaron', values: [4, 9, 6] },
  { key: 'seated', label: 'Se sentaron', values: [3, 8, 5] },
];

describe('GroupedBarChart', () => {
  it('names the figure with its title', () => {
    render(<GroupedBarChart categories={CATEGORIES} series={SERIES} title="Volumen por hora" />);

    expect(screen.getByRole('figure', { name: 'Volumen por hora' })).toBeInTheDocument();
  });

  it('shows a legend for two series', () => {
    render(<GroupedBarChart categories={CATEGORIES} series={SERIES} title="Volumen" />);

    // Scoped to the legend: the table view repeats the series names.
    const legend = screen.getByRole('list');
    expect(within(legend).getByText('Se anotaron')).toBeInTheDocument();
    expect(within(legend).getByText('Se sentaron')).toBeInTheDocument();
  });

  it('omits the legend for a single series, which the title already names', () => {
    render(<GroupedBarChart categories={CATEGORIES} series={[SERIES[0]!]} title="Se anotaron" />);

    expect(screen.getByRole('figure', { name: 'Se anotaron' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('assigns colours by series position, not by value', () => {
    const { container } = render(
      <GroupedBarChart categories={CATEGORIES} series={SERIES} title="Volumen" />,
    );
    const fills = [...container.querySelectorAll('path')].map((node) => node.getAttribute('fill'));

    // Series one is always slot one, regardless of which bar is tallest.
    expect(fills.filter((fill) => fill === chartTokens.series[0])).toHaveLength(3);
    expect(fills.filter((fill) => fill === chartTokens.series[1])).toHaveLength(3);
  });

  it('exposes every value in a table view, not only in the plot', () => {
    render(<GroupedBarChart categories={CATEGORIES} series={SERIES} title="Volumen" />);

    const table = screen.getByRole('table', { name: 'Volumen' });
    expect(table).toHaveTextContent('13:00');
    expect(table).toHaveTextContent('9');
  });

  it('renders without a plot when every value is zero', () => {
    // An empty day must not divide by zero or draw an inverted axis.
    const empty = [{ key: 'joined', label: 'Se anotaron', values: [0, 0, 0] }];

    expect(() =>
      render(<GroupedBarChart categories={CATEGORIES} series={empty} title="Volumen" />),
    ).not.toThrow();
  });
});

const ROWS = ['Lun', 'Mar'];
const COLUMNS = ['00', '01', '02'];
const CELLS = [
  { row: 0, column: 0, value: 0 },
  { row: 0, column: 1, value: 5 },
  { row: 1, column: 2, value: 10 },
];

describe('Heatmap', () => {
  it('names the figure with its title', () => {
    render(
      <Heatmap
        rowLabels={ROWS}
        columnLabels={COLUMNS}
        cells={CELLS}
        highest={10}
        title="Horas pico"
      />,
    );

    expect(screen.getByRole('figure', { name: /Horas pico/ })).toBeInTheDocument();
  });

  it('gives every cell an accessible description, so colour is never the only cue', () => {
    render(
      <Heatmap
        rowLabels={ROWS}
        columnLabels={COLUMNS}
        cells={CELLS}
        highest={10}
        title="Horas pico"
        describeCell={(row, column, value) => `${row} ${column}h: ${value} personas`}
      />,
    );

    expect(screen.getByLabelText('Mar 02h: 10 personas')).toBeInTheDocument();
    expect(screen.getByLabelText('Lun 00h: 0 personas')).toBeInTheDocument();
  });

  it('draws an empty cell as a faint wash rather than the palest ramp step', () => {
    render(
      <Heatmap
        rowLabels={ROWS}
        columnLabels={COLUMNS}
        cells={CELLS}
        highest={10}
        title="Horas pico"
        describeCell={(row, column, value) => `${row} ${column}: ${value}`}
      />,
    );

    const empty = screen.getByLabelText('Lun 00: 0');
    // No inline colour at all: it is not on the ramp, because "nobody came" is
    // a different fact from "a few people came".
    expect(empty).toHaveClass('bg-background');
    expect(empty.getAttribute('style')).toBeFalsy();
  });

  it('paints the busiest cell with the darkest step', () => {
    render(
      <Heatmap
        rowLabels={ROWS}
        columnLabels={COLUMNS}
        cells={CELLS}
        highest={10}
        title="Horas pico"
        describeCell={(row, column, value) => `${row} ${column}: ${value}`}
      />,
    );

    const busiest = screen.getByLabelText('Mar 02: 10');
    const darkest = chartTokens.sequential[chartTokens.sequential.length - 1]!;
    // jsdom serializes an inline colour as rgb(), so compare in that space.
    const [r, g, b] = [1, 3, 5].map((at) => parseInt(darkest.slice(at, at + 2), 16));
    expect(busiest).toHaveStyle({ backgroundColor: `rgb(${r}, ${g}, ${b})` });
  });

  it('reports the focused cell in a live region', async () => {
    render(
      <Heatmap
        rowLabels={ROWS}
        columnLabels={COLUMNS}
        cells={CELLS}
        highest={10}
        title="Horas pico"
        describeCell={(row, column, value) => `${row} ${column}: ${value}`}
      />,
    );

    await userEvent.tab();

    expect(screen.getByRole('status')).toHaveTextContent('Lun 00: 0');
  });

  it('exposes the grid as a table', () => {
    render(
      <Heatmap
        rowLabels={ROWS}
        columnLabels={COLUMNS}
        cells={CELLS}
        highest={10}
        title="Horas pico"
      />,
    );

    expect(screen.getByRole('table', { name: /Horas pico/ })).toBeInTheDocument();
  });
});
