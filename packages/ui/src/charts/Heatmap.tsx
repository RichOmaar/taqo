'use client';

import { useId, useState } from 'react';

import { chart as chartTokens } from '../tokens';
import { cn } from '../utils/cn';
import { rampIndex } from './primitives';

export interface HeatmapCell {
  row: number;
  column: number;
  value: number;
}

export interface HeatmapProps {
  rowLabels: string[];
  columnLabels: string[];
  cells: HeatmapCell[];
  title: string;
  /** Highest value in the grid, for scaling the ramp. */
  highest: number;
  /** Reads a cell for the tooltip and the table view. */
  describeCell?: (row: string, column: string, value: number) => string;
  /** Show every nth column label, to stop dense axes colliding. */
  labelStride?: number;
  className?: string;
}

/**
 * Grid of magnitude on one hue.
 *
 * A single hue, light to dark, is the whole point: the mock encoded intensity by
 * swapping both colour token *and* opacity, which is not monotonic — a reader
 * cannot order two cells by eye if one is lighter but more saturated.
 *
 * An empty cell is drawn as bare surface rather than the palest step, because
 * "nobody came" is a different fact from "a few people came".
 */
export function Heatmap({
  rowLabels,
  columnLabels,
  cells,
  title,
  highest,
  describeCell = (row, column, value) => `${row} ${column}: ${value}`,
  labelStride = 1,
  className,
}: HeatmapProps) {
  const titleId = useId();
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);

  const byKey = new Map(cells.map((cell) => [`${cell.row}:${cell.column}`, cell.value]));
  const steps = chartTokens.sequential;

  return (
    <figure className={cn('m-0', className)} aria-labelledby={titleId}>
      <figcaption
        id={titleId}
        className="mb-3 flex flex-wrap items-center justify-between gap-2 font-display text-base font-semibold text-foreground"
      >
        {title}
        <span className="flex items-center gap-1.5 font-body text-[11px] font-normal text-muted">
          Menos
          <span className="flex gap-0.5" aria-hidden="true">
            {steps.map((step) => (
              <span key={step} className="h-3 w-3 rounded-sm" style={{ backgroundColor: step }} />
            ))}
          </span>
          Más
        </span>
      </figcaption>

      {/* Wide grids scroll inside their own container rather than pushing the
          page sideways. */}
      <div className="overflow-x-auto">
        <div className="min-w-[520px]" onMouseLeave={() => setHovered(null)}>
          <div className="flex">
            <div className="w-10 shrink-0" />
            <div className="flex flex-1 gap-0.5">
              {columnLabels.map((label, column) => (
                <span key={label} className="flex-1 text-center font-body text-[10px] text-muted">
                  {column % Math.max(1, labelStride) === 0 ? label : ''}
                </span>
              ))}
            </div>
          </div>

          {rowLabels.map((rowLabel, row) => (
            <div key={rowLabel} className="mt-0.5 flex items-center">
              <span className="w-10 shrink-0 pr-2 text-right font-body text-[10px] text-muted">
                {rowLabel}
              </span>
              <div className="flex flex-1 gap-0.5">
                {columnLabels.map((columnLabel, column) => {
                  const value = byKey.get(`${row}:${column}`) ?? 0;
                  const step = rampIndex(value, highest, steps.length);
                  const isHovered = hovered?.row === row && hovered?.column === column;

                  return (
                    <button
                      key={columnLabel}
                      type="button"
                      // Focusable so the grid is reachable without a mouse; the
                      // tooltip doubles as the focus affordance.
                      onMouseEnter={() => setHovered({ row, column, value })}
                      onFocus={() => setHovered({ row, column, value })}
                      onBlur={() => setHovered(null)}
                      aria-label={describeCell(rowLabel, columnLabel, value)}
                      className={cn(
                        'h-5 flex-1 rounded-sm transition-transform',
                        // Empty cells get a faint wash, not a border: an outline
                        // around every quiet hour is more ink than the data, and
                        // on a mostly-empty grid the borders become the picture.
                        step === -1 && 'bg-background',
                        isHovered && 'scale-110',
                      )}
                      style={step === -1 ? undefined : { backgroundColor: steps[step] }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p role="status" className="mt-2 min-h-[1.25rem] font-body text-xs text-muted">
        {hovered
          ? describeCell(
              rowLabels[hovered.row] ?? '',
              columnLabels[hovered.column] ?? '',
              hovered.value,
            )
          : ''}
      </p>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            {columnLabels.map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((rowLabel, row) => (
            <tr key={rowLabel}>
              <th scope="row">{rowLabel}</th>
              {columnLabels.map((columnLabel, column) => (
                <td key={columnLabel}>{byKey.get(`${row}:${column}`) ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
