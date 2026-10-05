import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface DataTableColumn<Row> {
  /** Stable identity for the column; also the React key. */
  key: string;
  header: string;
  /** Cell contents for a row. Return preformatted values. */
  render: (row: Row) => ReactNode;
  /** Right-align numeric columns. */
  align?: 'left' | 'right';
  /** Hide below `md`, for columns that are not worth the width on a tablet. */
  hideOnSmall?: boolean;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  /** Stable React key per row. */
  rowKey: (row: Row) => string;
  /** Shown in place of the table when there are no rows. */
  empty?: ReactNode;
  caption?: string;
  className?: string;
}

/**
 * Presentational table. Sorting, paging and filtering belong to the caller —
 * this renders exactly the rows it is given, in the order given.
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
  className,
}: DataTableProps<Row>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    // Wide tables scroll inside their own container rather than pushing the
    // page sideways.
    <div className={cn('overflow-x-auto rounded-xl bg-surface shadow-soft', className)}>
      <table className="w-full border-collapse text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-muted',
                  column.align === 'right' && 'text-right',
                  column.hideOnSmall && 'hidden md:table-cell',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-b-0">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 font-body text-sm text-foreground',
                    column.align === 'right' && 'text-right',
                    column.hideOnSmall && 'hidden md:table-cell',
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
