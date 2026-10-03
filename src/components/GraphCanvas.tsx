import React, { useRef, useState, useEffect } from 'react';
import { RoadNetworkGraph } from '../algorithms/graph.ts';
import { Road, DSUSnapshot } from '../types.ts';

interface GraphCanvasProps {
  graph: RoadNetworkGraph;
  selectedRoads: Road[];
  consideredRoad: Road | null;
  rejectedRoads: Road[];
  visitedTowns?: string[];
  dsuSnapshot?: DSUSnapshot;
  isPrim: boolean;
  onUpdatePosition?: (town: string, x: number, y: number) => void;
  width?: number;
  height?: number;
}

const COMPONENT_COLORS = [
  '#0284c7', // Sky Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#10b981', // Emerald
  '#eab308', // Yellow
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#f43f5e', // Rose
];

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph,
  selectedRoads,
  consideredRoad,
  rejectedRoads,
  visitedTowns,
  dsuSnapshot,
  isPrim,
  onUpdatePosition,
  width = 720,
  height = 460,
}) => {
  const [draggingTown, setDraggingTown] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Canonicalize helper
  const isSameRoad = (r1: Road, r2: Road | null) => {
    if (!r2) return false;
    const [u1, v1] = RoadNetworkGraph.canonicalEdge(r1.u, r1.v);
    const [u2, v2] = RoadNetworkGraph.canonicalEdge(r2.u, r2.v);
    return u1 === u2 && v1 === v2;
  };

  const isSelected = (r: Road) => selectedRoads.some((sr) => isSameRoad(r, sr));
  const isRejected = (r: Road) => rejectedRoads.some((rr) => isSameRoad(r, rr));
  const isConsidered = (r: Road) => isSameRoad(r, consideredRoad);

  // Map towns to component color index for Kruskal
  const townComponentColor: Record<string, string> = {};
  if (!isPrim && dsuSnapshot) {
    const roots = Object.keys(dsuSnapshot.components).sort();
    roots.forEach((root, idx) => {
      const color = COMPONENT_COLORS[idx % COMPONENT_COLORS.length];
      const members = dsuSnapshot.components[root] || [];
      members.forEach((m) => {
        townComponentColor[m] = color;
      });
    });
  }

  // Mouse drag handling
  const handleMouseDown = (town: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const pos = graph.positions[town] || { x: 100, y: 100 };
    setDraggingTown(town);
    setDragOffset({
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTown || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const newX = Math.max(40, Math.min(width - 40, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(40, Math.min(height - 40, e.clientY - rect.top - dragOffset.y));

    if (onUpdatePosition) {
      onUpdatePosition(draggingTown, Math.round(newX), Math.round(newY));
    } else {
      graph.positions[draggingTown] = { x: Math.round(newX), y: Math.round(newY) };
    }
  };

  const handleMouseUp = () => {
    setDraggingTown(null);
  };

  // Group roads by status for correct SVG layering (unprocessed bottom, considered top)
  const unprocessedRoads: Road[] = [];
  const rejectedList: Road[] = [];
  const selectedList: Road[] = [];
  let currentConsidered: Road | null = null;

  for (const r of graph.roads) {
    if (isConsidered(r)) {
      currentConsidered = r;
    } else if (isSelected(r)) {
      selectedList.push(r);
    } else if (isRejected(r)) {
      rejectedList.push(r);
    } else {
      unprocessedRoads.push(r);
    }
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950/80 shadow-2xl select-none">
      {/* Visual Canvas Header / Badge */}
      <div className="absolute top-3 left-4 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs font-mono text-slate-300">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Interactive Physics Canvas • Drag towns to adjust</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[400px] md:h-[460px] cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Subtle Grid pattern */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          {/* Glow filter for considered edge */}
          <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Grid */}
        <rect width={width} height={height} fill="url(#grid)" />

        {/* 1. Unprocessed Roads */}
        {unprocessedRoads.map((r, i) => {
          const p1 = graph.positions[r.u] || { x: 100, y: 100 };
          const p2 = graph.positions[r.v] || { x: 200, y: 200 };
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          return (
            <g key={`unproc-${r.u}-${r.v}-${i}`}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#475569"
                strokeWidth={2}
                strokeOpacity={0.45}
              />
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x="-18" y="-10" width="36" height="20" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <text textAnchor="middle" dy="4" fill="#94a3b8" fontSize="10" fontWeight="600" className="font-mono">
                  ${r.cost}k
                </text>
              </g>
            </g>
          );
        })}

        {/* 2. Rejected Cycle Roads */}
        {rejectedList.map((r, i) => {
          const p1 = graph.positions[r.u] || { x: 100, y: 100 };
          const p2 = graph.positions[r.v] || { x: 200, y: 200 };
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          return (
            <g key={`rej-${r.u}-${r.v}-${i}`}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#ef4444"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                strokeOpacity={0.85}
              />
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x="-24" y="-11" width="48" height="22" rx="6" fill="#450a0a" stroke="#dc2626" strokeWidth="1.2" />
                <text textAnchor="middle" dy="4" fill="#fca5a5" fontSize="10" fontWeight="bold" className="font-mono">
                  ✗ ${r.cost}k
                </text>
              </g>
            </g>
          );
        })}

        {/* 3. Selected MST Roads */}
        {selectedList.map((r, i) => {
          const p1 = graph.positions[r.u] || { x: 100, y: 100 };
          const p2 = graph.positions[r.v] || { x: 200, y: 200 };
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          return (
            <g key={`mst-${r.u}-${r.v}-${i}`}>
              {/* Outer soft shadow */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#059669"
                strokeWidth={7}
                strokeOpacity={0.3}
              />
              {/* Core bold green line */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#10b981"
                strokeWidth={4}
                strokeLinecap="round"
              />
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x="-22" y="-11" width="44" height="22" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text textAnchor="middle" dy="4" fill="#a7f3d0" fontSize="10" fontWeight="bold" className="font-mono">
                  ✓ ${r.cost}k
                </text>
              </g>
            </g>
          );
        })}

        {/* 4. Currently Considered Road (Pulsing Amber) */}
        {currentConsidered && (() => {
          const p1 = graph.positions[currentConsidered.u] || { x: 100, y: 100 };
          const p2 = graph.positions[currentConsidered.v] || { x: 200, y: 200 };
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          return (
            <g key={`considered-${currentConsidered.u}-${currentConsidered.v}`}>
              {/* Animated pulsating outer glow */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#f59e0b"
                strokeWidth={10}
                strokeOpacity={0.4}
                className="animate-pulse"
                filter="url(#gold-glow)"
              />
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#fbbf24"
                strokeWidth={4.5}
                strokeLinecap="round"
              />
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x="-26" y="-12" width="52" height="24" rx="7" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
                <text textAnchor="middle" dy="4.5" fill="#fef08a" fontSize="10" fontWeight="800" className="font-mono">
                  ⚡ ${currentConsidered.cost}k
                </text>
              </g>
            </g>
          );
        })()}

        {/* 5. Towns (Vertices) */}
        {graph.towns.map((town) => {
          const pos = graph.positions[town] || { x: 150, y: 150 };
          const isVisited = isPrim ? (visitedTowns || []).includes(town) : true;
          const compColor = !isPrim && townComponentColor[town] ? townComponentColor[town] : null;

          let fillColor = '#1e293b';
          let strokeColor = '#38bdf8';
          let glowColor = 'transparent';

          if (isPrim) {
            if (isVisited) {
              fillColor = '#064e3b';
              strokeColor = '#34d399';
              glowColor = 'rgba(52, 211, 153, 0.4)';
            } else {
              fillColor = '#1e293b';
              strokeColor = '#64748b';
            }
          } else if (compColor) {
            fillColor = compColor;
            strokeColor = '#ffffff';
            glowColor = `${compColor}66`;
          }

          const isNodeActive = consideredRoad && (consideredRoad.u === town || consideredRoad.v === town);

          return (
            <g
              key={`node-${town}`}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="cursor-pointer group"
              onMouseDown={(e) => handleMouseDown(town, e)}
            >
              {/* Active glow halo */}
              {isNodeActive && (
                <circle r={28} fill="none" stroke="#fbbf24" strokeWidth={3} strokeOpacity={0.6} className="animate-ping" />
              )}
              {/* Outer shadow / selection halo */}
              <circle r={22} fill={glowColor} />
              {/* Town circle */}
              <circle
                r={18}
                fill={fillColor}
                stroke={isNodeActive ? '#fbbf24' : strokeColor}
                strokeWidth={isNodeActive ? 3 : 2.5}
                className="transition-all duration-200 group-hover:scale-110"
              />
              {/* Town initial / small badge */}
              <text
                textAnchor="middle"
                dy="4"
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
                className="pointer-events-none select-none"
              >
                {town.charAt(0)}
              </text>
              {/* Town full label beneath node */}
              <g transform="translate(0, 29)">
                <rect
                  x={-(town.length * 4.2 + 8)}
                  y="-9"
                  width={town.length * 8.4 + 16}
                  height="18"
                  rx="5"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="1"
                  fillOpacity="0.9"
                />
                <text
                  textAnchor="middle"
                  dy="3.5"
                  fill="#f1f5f9"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none select-none tracking-wide"
                >
                  {town}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Canvas Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-1 bg-emerald-500 rounded-full inline-block"></span>
            <span className="text-slate-300 font-medium">MST Road</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-1 bg-amber-400 rounded-full inline-block animate-pulse"></span>
            <span className="text-amber-300 font-medium">Currently Considered</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-1 border-b-2 border-dashed border-rose-500 inline-block"></span>
            <span className="text-rose-400 font-medium">Rejected Cycle</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-1 bg-slate-600 rounded-full inline-block"></span>
            <span className="text-slate-400">Unprocessed</span>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          {isPrim ? (
            <span>🟢 Green Towns = In MST Tree • ⚪ Gray Towns = Unvisited</span>
          ) : (
            <span>🎨 Town Color = DSU Connected Component</span>
          )}
        </div>
      </div>
    </div>
  );
};
