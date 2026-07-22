import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SortableList } from './SortableList';

interface Row {
  id: string;
  name: string;
}

const ROWS: Row[] = [
  { id: 'a', name: 'Primera' },
  { id: 'b', name: 'Segunda' },
  { id: 'c', name: 'Tercera' },
];

function List({ onReorder = vi.fn() }: { onReorder?: (rows: Row[]) => void }) {
  return (
    <SortableList items={ROWS} getId={(row) => row.id} onReorder={onReorder} label="Pregunta">
      {(row) => <span>{row.name}</span>}
    </SortableList>
  );
}

/** Live version, so assertions can read the order after an interaction. */
function LiveList() {
  const [rows, setRows] = useState(ROWS);
  return (
    <SortableList items={rows} getId={(row) => row.id} onReorder={setRows} label="Pregunta">
      {(row) => <span>{row.name}</span>}
    </SortableList>
  );
}

function order(): string[] {
  return screen
    .getAllByRole('listitem')
    .map((item) => item.textContent?.replace(/[⠿▲▼]/g, '') ?? '');
}

describe('SortableList', () => {
  it('renders every item in order', () => {
    render(<List />);

    expect(order()).toEqual(['Primera', 'Segunda', 'Tercera']);
  });

  it('names the list for assistive tech', () => {
    render(<List />);

    expect(screen.getByRole('list', { name: 'Pregunta' })).toBeInTheDocument();
  });

  describe('reordering by click', () => {
    // The path that works without a pointer, and the faster one for moving a
    // single row by a single position.
    it('moves an item down', async () => {
      render(<LiveList />);

      await userEvent.click(screen.getByLabelText('Bajar: Pregunta 1 de 3'));

      expect(order()).toEqual(['Segunda', 'Primera', 'Tercera']);
    });

    it('moves an item up', async () => {
      render(<LiveList />);

      await userEvent.click(screen.getByLabelText('Subir: Pregunta 3 de 3'));

      expect(order()).toEqual(['Primera', 'Tercera', 'Segunda']);
    });

    it('reports the reordered list, not a mutation of the original', async () => {
      const onReorder = vi.fn();
      render(<List onReorder={onReorder} />);

      await userEvent.click(screen.getByLabelText('Bajar: Pregunta 1 de 3'));

      expect(onReorder).toHaveBeenCalledWith([ROWS[1], ROWS[0], ROWS[2]]);
      expect(ROWS[0]?.name).toBe('Primera');
    });

    it('disables moving the first item up and the last down', () => {
      render(<List />);

      expect(screen.getByLabelText('Subir: Pregunta 1 de 3')).toBeDisabled();
      expect(screen.getByLabelText('Bajar: Pregunta 3 de 3')).toBeDisabled();
      expect(screen.getByLabelText('Bajar: Pregunta 1 de 3')).toBeEnabled();
    });

    it('is reachable by keyboard alone', async () => {
      render(<LiveList />);

      // Drag handle first, then "move down" — "move up" is disabled on the
      // first row, and a disabled button is not in the tab order at all.
      await userEvent.tab();
      await userEvent.tab();
      expect(screen.getByLabelText('Bajar: Pregunta 1 de 3')).toHaveFocus();

      await userEvent.keyboard('{Enter}');

      expect(order()).toEqual(['Segunda', 'Primera', 'Tercera']);
    });
  });

  it('offers a drag handle per row without making the whole row draggable', () => {
    // Text inside a row stays selectable, which it would not if the row itself
    // were the drag target.
    render(<List />);

    expect(screen.getByLabelText('Arrastrar para reordenar: Pregunta 1')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Arrastrar para reordenar/)).toHaveLength(3);
  });

  it('renders nothing for an empty list without failing', () => {
    render(
      <SortableList items={[]} getId={(row: Row) => row.id} onReorder={vi.fn()} label="Pregunta">
        {(row) => <span>{row.name}</span>}
      </SortableList>,
    );

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
