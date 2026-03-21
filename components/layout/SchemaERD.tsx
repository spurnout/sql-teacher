"use client";

import { useState, useCallback } from "react";
import { SCHEMA_REFERENCE } from "@/content/schema/reference";

/** FK relationships between tables */
const RELATIONSHIPS = [
  { from: "subscriptions", fromCol: "user_id", to: "users", toCol: "id" },
  { from: "subscriptions", fromCol: "product_id", to: "products", toCol: "id" },
  { from: "orders", fromCol: "user_id", to: "users", toCol: "id" },
  { from: "order_items", fromCol: "order_id", to: "orders", toCol: "id" },
  { from: "order_items", fromCol: "product_id", to: "products", toCol: "id" },
  { from: "events", fromCol: "user_id", to: "users", toCol: "id" },
] as const;

/** Table positions in the ERD layout */
const TABLE_POSITIONS: Record<string, { x: number; y: number }> = {
  users: { x: 20, y: 20 },
  products: { x: 320, y: 20 },
  subscriptions: { x: 170, y: 200 },
  orders: { x: 20, y: 370 },
  order_items: { x: 320, y: 370 },
  events: { x: 20, y: 540 },
};

const TABLE_WIDTH = 220;
const TABLE_HEADER_HEIGHT = 28;
const ROW_HEIGHT = 20;

interface Props {
  readonly highlightColumn?: string;
}

export default function SchemaERD({ highlightColumn }: Props) {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

  const toggleTable = useCallback((tableName: string) => {
    setExpandedTable((prev) => (prev === tableName ? null : tableName));
  }, []);

  // Compute which columns are highlighted via FK relationships
  const highlightedCols = new Set<string>();
  if (hoveredCol) {
    highlightedCols.add(hoveredCol);
    for (const rel of RELATIONSHIPS) {
      const fromKey = `${rel.from}.${rel.fromCol}`;
      const toKey = `${rel.to}.${rel.toCol}`;
      if (hoveredCol === fromKey) highlightedCols.add(toKey);
      if (hoveredCol === toKey) highlightedCols.add(fromKey);
    }
  }

  // Get table height
  const getTableHeight = (tableName: string) => {
    const table = SCHEMA_REFERENCE.tables.find((t) => t.name === tableName);
    if (!table) return TABLE_HEADER_HEIGHT;
    return TABLE_HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + 4;
  };

  // Get connection point for a column
  const getColY = (tableName: string, colName: string) => {
    const table = SCHEMA_REFERENCE.tables.find((t) => t.name === tableName);
    if (!table) return 0;
    const colIndex = table.columns.findIndex((c) => c.name === colName);
    const pos = TABLE_POSITIONS[tableName];
    return pos.y + TABLE_HEADER_HEIGHT + colIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
  };

  // SVG viewbox dimensions
  const svgWidth = 580;
  const svgHeight = 700;

  return (
    <div className="h-full overflow-auto p-2">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ minHeight: "600px" }}
      >
        {/* Relationship lines */}
        {RELATIONSHIPS.map((rel, i) => {
          const fromPos = TABLE_POSITIONS[rel.from];
          const toPos = TABLE_POSITIONS[rel.to];
          if (!fromPos || !toPos) return null;

          const fromX = fromPos.x + TABLE_WIDTH;
          const fromY = getColY(rel.from, rel.fromCol);
          const toX = toPos.x;
          const toY = getColY(rel.to, rel.toCol);

          // Decide connection side
          let x1: number, x2: number;
          if (fromPos.x > toPos.x + TABLE_WIDTH) {
            x1 = fromPos.x;
            x2 = toPos.x + TABLE_WIDTH;
          } else if (fromPos.x + TABLE_WIDTH < toPos.x) {
            x1 = fromPos.x + TABLE_WIDTH;
            x2 = toPos.x;
          } else {
            x1 = fromPos.x + TABLE_WIDTH;
            x2 = toPos.x;
          }

          const isHighlighted =
            hoveredCol === `${rel.from}.${rel.fromCol}` ||
            hoveredCol === `${rel.to}.${rel.toCol}`;

          const midX = (x1 + x2) / 2;

          return (
            <g key={i}>
              <path
                d={`M ${x1} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${x2} ${toY}`}
                fill="none"
                stroke={isHighlighted ? "var(--primary)" : "var(--border)"}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={isHighlighted ? "none" : "4,3"}
                opacity={isHighlighted ? 1 : 0.5}
              />
              {/* Arrow at target */}
              <circle
                cx={x2}
                cy={toY}
                r={3}
                fill={isHighlighted ? "var(--primary)" : "var(--border)"}
                opacity={isHighlighted ? 1 : 0.5}
              />
            </g>
          );
        })}

        {/* Tables */}
        {SCHEMA_REFERENCE.tables.map((table) => {
          const pos = TABLE_POSITIONS[table.name];
          if (!pos) return null;
          const height = getTableHeight(table.name);
          const isExpanded = expandedTable === table.name;

          return (
            <g key={table.name}>
              {/* Table background */}
              <rect
                x={pos.x}
                y={pos.y}
                width={TABLE_WIDTH}
                height={height}
                rx={6}
                fill="var(--card)"
                stroke={isExpanded ? "var(--primary)" : "var(--border)"}
                strokeWidth={isExpanded ? 1.5 : 1}
                className="cursor-pointer"
                onClick={() => toggleTable(table.name)}
              />

              {/* Header */}
              <rect
                x={pos.x}
                y={pos.y}
                width={TABLE_WIDTH}
                height={TABLE_HEADER_HEIGHT}
                rx={6}
                fill="var(--accent)"
                className="cursor-pointer"
                onClick={() => toggleTable(table.name)}
              />
              {/* Fix bottom corners of header */}
              <rect
                x={pos.x}
                y={pos.y + TABLE_HEADER_HEIGHT - 6}
                width={TABLE_WIDTH}
                height={6}
                fill="var(--accent)"
              />

              <text
                x={pos.x + 10}
                y={pos.y + 18}
                fontSize={12}
                fontWeight={600}
                fontFamily="monospace"
                fill="var(--primary)"
                className="cursor-pointer"
                onClick={() => toggleTable(table.name)}
              >
                {table.name}
              </text>

              {/* Columns */}
              {table.columns.map((col, colIdx) => {
                const colKey = `${table.name}.${col.name}`;
                const cy = pos.y + TABLE_HEADER_HEIGHT + colIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                const isHL = highlightedCols.has(colKey);
                const isFK = col.note?.startsWith("FK");
                const isPK = col.note === "PK";

                return (
                  <g
                    key={col.name}
                    onMouseEnter={() => setHoveredCol(colKey)}
                    onMouseLeave={() => setHoveredCol(null)}
                    className="cursor-default"
                  >
                    {/* Hover background */}
                    {isHL && (
                      <rect
                        x={pos.x + 1}
                        y={cy - ROW_HEIGHT / 2}
                        width={TABLE_WIDTH - 2}
                        height={ROW_HEIGHT}
                        fill="var(--primary)"
                        opacity={0.1}
                      />
                    )}

                    {/* PK/FK indicator */}
                    {(isPK || isFK) && (
                      <text
                        x={pos.x + 8}
                        y={cy + 4}
                        fontSize={8}
                        fontFamily="monospace"
                        fill={isPK ? "var(--cta)" : "var(--primary)"}
                        fontWeight={600}
                      >
                        {isPK ? "🔑" : "→"}
                      </text>
                    )}

                    {/* Column name */}
                    <text
                      x={pos.x + (isPK || isFK ? 24 : 10)}
                      y={cy + 4}
                      fontSize={10}
                      fontFamily="monospace"
                      fill={isHL ? "var(--foreground)" : "var(--foreground)"}
                      fontWeight={isHL ? 600 : 400}
                    >
                      {col.name}
                    </text>

                    {/* Type */}
                    <text
                      x={pos.x + TABLE_WIDTH - 10}
                      y={cy + 4}
                      fontSize={9}
                      fontFamily="monospace"
                      fill="var(--muted-foreground)"
                      textAnchor="end"
                      opacity={0.6}
                    >
                      {col.type}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Expanded table detail */}
      {expandedTable && (
        <div className="mt-3 p-3 bg-[var(--accent)]/30 border border-[var(--border)] rounded-lg">
          <h4 className="text-xs font-semibold font-mono text-[var(--primary)] mb-2">
            {expandedTable}
          </h4>
          <div className="space-y-1">
            {SCHEMA_REFERENCE.tables
              .find((t) => t.name === expandedTable)
              ?.columns.map((col) => (
                <div
                  key={col.name}
                  className="flex items-baseline gap-2 text-xs"
                >
                  <span className="font-mono font-medium w-28 shrink-0">
                    {col.name}
                  </span>
                  <span className="font-mono text-[var(--muted-foreground)] w-20 shrink-0">
                    {col.type}
                  </span>
                  {col.note && (
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {col.note}
                    </span>
                  )}
                </div>
              ))}
          </div>

          {/* Show relationships */}
          {RELATIONSHIPS.filter(
            (r) => r.from === expandedTable || r.to === expandedTable
          ).length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--border)]">
              <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wide mb-1">
                Relationships
              </p>
              {RELATIONSHIPS.filter(
                (r) => r.from === expandedTable || r.to === expandedTable
              ).map((rel, i) => (
                <p key={i} className="text-[10px] text-[var(--muted-foreground)] font-mono">
                  {rel.from}.{rel.fromCol} → {rel.to}.{rel.toCol}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
