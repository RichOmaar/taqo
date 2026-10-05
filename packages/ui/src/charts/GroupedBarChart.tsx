'use client';

import { max } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import { useId, useState } from 'react';

import { chart as chartTokens } from '../tokens';
import { cn } from '../utils/cn';
import { columnPath, niceTicks, tickIndices } from './primitives';

export interface BarSeries {
  key: string;
  label: string;
  /** One value per category, same order and length as `categories`. */
  values: number[];
}

export interface GroupedBarChartProps {
  categories: string[];
  /** One or two series. Colours are assigned by position and never cycled. */
  series: BarSeries[];
  /** Names what is plotted; also the accessible name of the figure. */
  title: string;
  /** Formats values in the tooltip and the table view. */
  formatValue?: (value: number) => string;
  /** Show every nth category label, to stop dense axes colliding. */
  labelStride?: number;
  height?: number;
  className?: string;
}

const MARGIN = { top: 8, right: 8, bottom: 28, left: 36 };
/** Bars never fill their slot; the leftover is deliberate air. */
const MAX_BAR_WIDTH = 24;
/** Surface gap separating adjacent bars — white does the separating. */
const BAR_GAP = 2;

/**
 * Grouped columns on a single shared axis.
 *
 * One axis only: two measures of different magnitude belong in two charts, not
 * on a second y-scale, which invents a correlation the data does not contain.
 */
export function GroupedBarChart({
  categories,
  series,
  title,
  formatValue = (value) => String(value),
  labelStride = 1,
  height = 260,
  className,
}: GroupedBarChartProps) {
  const titleId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  const width = 720;
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const highest = max(series.flatMap((item) => item.values)) ?? 0;
  const ticks = niceTicks(highest);
  const axisTop = ticks[ticks.length - 1] ?? 1;

  const x = scaleBand<number>()
    .domain(categories.map((_, index) => index))
    .range([0, plotWidth])
    .paddingInner(0.25);

  const y = scaleLinear().domain([0, axisTop]).range([plotHeight, 0]);

  const slot = x.bandwidth();
  const barWidth = Math.max(
    1,
    Math.min(MAX_BAR_WIDTH, (slot - BAR_GAP * (series.length - 1)) / series.length),
  );
  const groupWidth = barWidth * series.length + BAR_GAP * (series.length - 1);

  const labelled = tickIndices(categories.length, labelStride);

  return (
    <figure className={cn('relative m-0', className)} aria-labelledby={titleId}>
      <figcaption
        id={titleId}
        className="mb-3 font-display text-base font-semibold text-foreground"
      >
        {title}
      </figcaption>

      {/* A legend is always present for two or more series; with one, the title
          already names what is plotted and a lone swatch would just restate it. */}
      {series.length > 1 && (
        <ul className="mb-2 flex list-none flex-wrap gap-4 p-0">
          {series.map((item, index) => (
            <li key={item.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: chartTokens.series[index] }}
              />
              <span className="font-body text-xs text-muted">{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="presentation"
        onMouseLeave={() => setHovered(null)}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={0}
                x2={plotWidth}
                y1={y(tick)}
                y2={y(tick)}
                stroke={chartTokens.grid}
                strokeWidth={1}
              />
              <text
                x={-8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted font-body text-[10px]"
              >
                {tick}
              </text>
            </g>
          ))}

          {categories.map((category, index) => {
            const bandStart = x(index) ?? 0;
            const groupStart = bandStart + (slot - groupWidth) / 2;

            return (
              <g key={category}>
                {/* Hit target spans the full column height: aiming at a 3px bar
                    is not a reasonable ask of anyone. */}
                <rect
                  x={bandStart}
                  y={0}
                  width={slot}
                  height={plotHeight}
                  fill="transparent"
                  onMouseEnter={() => setHovered(index)}
                />
                {series.map((item, seriesIndex) => {
                  const value = item.values[index] ?? 0;
                  const barHeight = plotHeight - y(value);
                  return (
                    <path
                      key={item.key}
                      d={columnPath(
                        groupStart + seriesIndex * (barWidth + BAR_GAP),
                        y(value),
                        barWidth,
                        barHeight,
                      )}
                      fill={chartTokens.series[seriesIndex]}
                      // Recede rather than disappear: the surrounding bars are
                      // the context that makes the hovered one worth reading.
                      opacity={hovered === null || hovered === index ? 1 : 0.7}
                      className="pointer-events-none transition-opacity"
                    />
                  );
                })}
              </g>
            );
          })}

          {labelled.map((index) => (
            <text
              key={index}
              x={(x(index) ?? 0) + slot / 2}
              y={plotHeight + 18}
              textAnchor="middle"
              className="fill-muted font-body text-[10px]"
            >
              {categories[index]}
            </text>
          ))}
        </g>
      </svg>

      {hovered !== null && (
        <div
          role="status"
          className="pointer-events-none absolute -top-1 right-0 rounded-lg bg-foreground px-3 py-2 text-left shadow-soft"
        >
          <p className="font-body text-[11px] font-semibold text-white">{categories[hovered]}</p>
          {series.map((item) => (
            <p key={item.key} className="font-body text-[11px] text-white/80">
              {item.label}: {formatValue(item.values[hovered] ?? 0)}
            </p>
          ))}
        </div>
      )}

      {/* Table view: the same numbers without relying on sight or colour. */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Periodo</th>
            {series.map((item) => (
              <th key={item.key} scope="col">
                {item.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category, index) => (
            <tr key={category}>
              <th scope="row">{category}</th>
              {series.map((item) => (
                <td key={item.key}>{formatValue(item.values[index] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
