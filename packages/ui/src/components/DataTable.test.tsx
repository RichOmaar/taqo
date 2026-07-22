import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataTable } from './DataTable';
import { EmptyState } from './EmptyState';
import { StatCard } from './StatCard';

interface Diner {
  id: string;
  name: string;
  party: number;
}

const ROWS: Diner[] = [
  { id: '1', name: 'Mariana', party: 2 },
  { id: '2', name: 'Jorge', party: 4 },
];

const COLUMNS = [
  { key: 'name', header: 'Nombre', render: (row: Diner) => row.name },
  { key: 'party', header: 'Personas', render: (row: Diner) => row.party, align: 'right' as const },
];

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Espera promedio" value="18 min" />);

    expect(screen.getByText('Espera promedio')).toBeInTheDocument();
    expect(screen.getByText('18 min')).toBeInTheDocument();
  });

  it('shows the hint instead of the value when data is too thin', () => {
    // A lifetime average over a handful of entries is worse than no number.
    render(<StatCard label="Espera promedio" value="410 min" hint="Datos insuficientes" />);

    expect(screen.getByText('Datos insuficientes')).toBeInTheDocument();
    expect(screen.queryByText('410 min')).not.toBeInTheDocument();
  });

  it('suppresses the delta while showing a hint', () => {
    render(<StatCard label="Personas hoy" value="0" delta="+12% vs ayer" hint="Sin datos aún" />);

    expect(screen.queryByText(/12%/)).not.toBeInTheDocument();
  });

  it('renders the delta when there is a real value', () => {
    render(<StatCard label="Personas hoy" value="142" delta="+12% vs sem. pasada" trend="up" />);

    expect(screen.getByText(/12% vs sem. pasada/)).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders the title, description and action', () => {
    render(
      <EmptyState
        title="Nadie en la fila"
        description="Cuando alguien se anote aparecerá aquí."
        action={<button>Agregar</button>}
      />,
    );

    expect(screen.getByText('Nadie en la fila')).toBeInTheDocument();
    expect(screen.getByText('Cuando alguien se anote aparecerá aquí.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
  });
});

describe('DataTable', () => {
  it('renders a header per column and a row per record', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(row) => row.id} />);

    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 rows
    expect(screen.getByText('Mariana')).toBeInTheDocument();
  });

  it('renders rows in the order given, without sorting them', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(row) => row.id} />);

    const cells = screen.getAllByRole('cell').map((cell) => cell.textContent);
    expect(cells).toEqual(['Mariana', '2', 'Jorge', '4']);
  });

  it('shows the empty slot instead of an empty table', () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={[]}
        rowKey={(row) => row.id}
        empty={<EmptyState title="Sin resultados" />}
      />,
    );

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('still renders the table when empty and no slot is given', () => {
    render(<DataTable columns={COLUMNS} rows={[]} rowKey={(row) => row.id} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
