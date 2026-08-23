"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface Room { name: string; area: number; floor: number; }
interface CostRange { min: number; max: number; currency: string; }
interface Option { id: string; label: string; styleTag: string; description: string; keyFeatures: string[]; rooms: Room[]; estimatedArea: number; structuralNotes: string; costRange: CostRange; }
interface AIResult { projectSummary: string; options: Option[]; structuralWarnings: string[]; aiRecommendation: string; }

// ── Room colour palette (fill) ─────────────────────────────────────────────
const ROOM_FILLS: Record<string, string> = {
  "Living": "#00c6e012", "Kitchen": "#f59e0b14", "Master Bedroom": "#1a5cff14",
  "Bedroom": "#a855f714", "Bathroom": "#22c55e14", "Toilet": "#22c55e14",
  "Corridor": "#44556614", "Hallway": "#44556614", "Dining": "#ef444414",
  "Store": "#78716c14", "Garage": "#57534e14", "Balcony": "#06b6d414",
  "Staircase": "#6366f114",
};

function roomFill(name: string) {
  const key = Object.keys(ROOM_FILLS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? ROOM_FILLS[key] : "#ffffff08";
}
function roomStroke(name: string) {
  const fills: Record<string, string> = {
    "Living": "#00c6e0", "Kitchen": "#f59e0b", "Master Bedroom": "#1a5cff",
    "Bedroom": "#a855f7", "Bathroom": "#22c55e", "Toilet": "#22c55e",
    "Corridor": "#445566", "Hallway": "#445566", "Dining": "#ef4444",
    "Store": "#78716c", "Garage": "#57534e", "Balcony": "#06b6d4",
    "Staircase": "#6366f1",
  };
  const key = Object.keys(fills).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? fills[key] : "#4a6480";
}

// ── Compute grid layout from room areas ─────────────────────────────────────
interface GridRoom { name: string; area: number; x: number; y: number; w: number; h: number; }

function buildGrid(rooms: Room[]): GridRoom[] {
  if (!rooms.length) return [];
  const SCALE = 14; // px per m²^0.5
  const COLS = 3;
  const PAD = 10;
  let col = 0, row = 0, maxH = 0;
  const result: GridRoom[] = [];
  let curX = PAD, curY = PAD;
  rooms.forEach((r) => {
    const side = Math.sqrt(r.area);
    const w = Math.max(80, side * SCALE);
    const h = Math.max(60, (r.area / side) * SCALE);
    if (col >= COLS) { col = 0; curX = PAD; curY += maxH + 2; maxH = 0; row++; }
    result.push({ name: r.name, area: r.area, x: curX, y: curY, w, h });
    curX += w + 2;
    maxH = Math.max(maxH, h);
    col++;
  });
  return result;
}

// ── Technical Architectural Floor Plan ──────────────────────────────────────
function ArchFloorPlan({ rooms, floor, label }: { rooms: Room[]; floor: number; label: string }) {
  const filtered = rooms.filter(r => r.floor === floor);
  if (!filtered.length) return null;
  const grid = buildGrid(filtered);
  const svgW = Math.max(...grid.map(r => r.x + r.w)) + 60;
  const svgH = Math.max(...grid.map(r => r.y + r.h)) + 60;
  const DIM_OFFSET = 22; // px gap for dimension lines

  return (
    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
      {/* Plan header */}
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#00c6e0" }}>FLOOR PLAN — {label.toUpperCase()}</span>
        <span style={{ fontSize: 10, color: "#4a6480" }}>Scale: 1:50  ·  All dims in metres</span>
      </div>

      <svg width="100%"
        style={{ display: "block", overflow: "visible" }}
        viewBox={`${-DIM_OFFSET} ${-DIM_OFFSET} ${svgW + DIM_OFFSET * 2} ${svgH + DIM_OFFSET * 2}`}
      >
        {/* Grid dots */}
        <defs>
          <pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="0.6" fill="#1e2a3a" />
          </pattern>
        </defs>
        <rect x={-DIM_OFFSET} y={-DIM_OFFSET} width={svgW + DIM_OFFSET * 2} height={svgH + DIM_OFFSET * 2} fill="url(#grid)" />

        {/* Outline bounding box */}
        <rect x={0} y={0} width={svgW} height={svgH}
          fill="none" stroke="#1e2a3a" strokeWidth={1} strokeDasharray="4,4" />

        {grid.map((r, i) => {
          const fill = roomFill(r.name);
          const stroke = roomStroke(r.name);
          const WALL = 3;
          const sqM = r.area;
          const wM = (r.w / 14).toFixed(1);   // fake metre from px
          const hM = (r.h / 14).toFixed(1);

          // door arc: bottom-left corner
          const doorW = Math.min(r.w * 0.28, 26);
          const doorX = r.x + WALL;
          const doorY = r.y + r.h - WALL;

          // window: centre top wall
          const winW = Math.min(r.w * 0.35, 30);
          const winX = r.x + (r.w - winW) / 2;

          return (
            <g key={i}>
              {/* Room fill */}
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={fill} />

              {/* Walls (thick stroke = architectural wall lines) */}
              <rect x={r.x} y={r.y} width={r.w} height={r.h}
                fill="none" stroke={stroke} strokeWidth={WALL} />

              {/* Inner light wall line */}
              <rect x={r.x + WALL} y={r.y + WALL}
                width={r.w - WALL * 2} height={r.h - WALL * 2}
                fill="none" stroke={stroke} strokeWidth={0.5} strokeOpacity={0.3} />

              {/* Door: arc quarter-circle at bottom-left */}
              <path
                d={`M ${doorX} ${doorY} L ${doorX} ${doorY - doorW} A ${doorW} ${doorW} 0 0 1 ${doorX + doorW} ${doorY} Z`}
                fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="none" opacity={0.7}
              />
              <line x1={doorX} y1={doorY} x2={doorX + doorW} y2={doorY} stroke={stroke} strokeWidth={1} opacity={0.7} />

              {/* Window: dashed line on top wall centre */}
              <line x1={winX} y1={r.y} x2={winX + winW} y2={r.y} stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
              <line x1={winX} y1={r.y} x2={winX + winW} y2={r.y} stroke={stroke} strokeWidth={1} strokeDasharray="3,2" />

              {/* Room label */}
              <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 7} textAnchor="middle"
                fill={stroke} fontSize={Math.min(11, r.w / 8)} fontWeight="bold" fontFamily="monospace">
                {r.name.length > 14 ? r.name.slice(0, 13) + "…" : r.name}
              </text>
              <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 8} textAnchor="middle"
                fill={stroke} fontSize={9} fontFamily="monospace" opacity={0.8}>
                {sqM} m²
              </text>

              {/* ── Dimension lines ── */}
              {/* Width dim (below room) */}
              <g>
                <line x1={r.x} y1={r.y + r.h + 8} x2={r.x + r.w} y2={r.y + r.h + 8}
                  stroke="#445566" strokeWidth={0.8} />
                {/* ticks */}
                <line x1={r.x} y1={r.y + r.h + 4} x2={r.x} y2={r.y + r.h + 12}
                  stroke="#445566" strokeWidth={0.8} />
                <line x1={r.x + r.w} y1={r.y + r.h + 4} x2={r.x + r.w} y2={r.y + r.h + 12}
                  stroke="#445566" strokeWidth={0.8} />
                <text x={r.x + r.w / 2} y={r.y + r.h + 20} textAnchor="middle"
                  fill="#445566" fontSize={8} fontFamily="monospace">
                  {wM} m
                </text>
              </g>
              {/* Height dim (right of room) */}
              <g>
                <line x1={r.x + r.w + 8} y1={r.y} x2={r.x + r.w + 8} y2={r.y + r.h}
                  stroke="#445566" strokeWidth={0.8} />
                <line x1={r.x + r.w + 4} y1={r.y} x2={r.x + r.w + 12} y2={r.y}
                  stroke="#445566" strokeWidth={0.8} />
                <line x1={r.x + r.w + 4} y1={r.y + r.h} x2={r.x + r.w + 12} y2={r.y + r.h}
                  stroke="#445566" strokeWidth={0.8} />
                <text
                  x={r.x + r.w + 19} y={r.y + r.h / 2}
                  textAnchor="middle" dominantBaseline="central"
                  fill="#445566" fontSize={8} fontFamily="monospace"
                  transform={`rotate(90, ${r.x + r.w + 19}, ${r.y + r.h / 2})`}
                >
                  {hM} m
                </text>
              </g>

              {/* Room index */}
              <text x={r.x + 5} y={r.y + 12} fill={stroke} fontSize={8} fontFamily="monospace" opacity={0.5}>
                {String(i + 1).padStart(2, "0")}
              </text>
            </g>
          );
        })}

        {/* North arrow */}
        <g transform={`translate(${svgW - 20}, 18)`}>
          <circle r={10} fill="#0d1929" stroke="#1e2a3a" strokeWidth={1} />
          <polygon points="0,-8 -4,4 0,2 4,4" fill="#00c6e0" />
          <text x={0} y={16} textAnchor="middle" fill="#4a6480" fontSize={7} fontFamily="monospace">N</text>
        </g>
      </svg>

      {/* Legend */}
      <div style={{ padding: "8px 14px", borderTop: "1px solid #1e293b", display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {filtered.map(r => (
          <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: roomFill(r.name), border: `1.5px solid ${roomStroke(r.name)}`, borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: "#4a6480", fontFamily: "monospace" }}>{r.name} ({r.area}m²)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Front Elevation ──────────────────────────────────────────────────────────
function FrontElevation({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  const W = 640, GND = 200, STORY_H = 56, WALL_T = 2;
  const totalH = stories * STORY_H;
  const bldX = 60, bldW = 480;
  const roofH = stories > 1 ? 38 : 28;
  const hasGarage = rooms.some(r => r.name.toLowerCase().includes("garage"));
  const hasBalcony = rooms.some(r => r.name.toLowerCase().includes("balcony"));
  const isModern = styleTag?.toLowerCase().includes("modern") || styleTag?.toLowerCase().includes("contemporary");

  // window columns spread across facade
  const winCols = [bldX + 50, bldX + 130, bldX + 220, bldX + 320, bldX + 400];
  const totalWidthM = Math.round(rooms.filter(r => r.floor === 1).reduce((s, r) => s + Math.sqrt(r.area), 0) * 0.9 * 10) / 10;

  return (
    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#00c6e0" }}>FRONT ELEVATION — VIEW A</span>
        <span style={{ fontSize: 10, color: "#4a6480" }}>Scale 1:50  ·  All dims in metres</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${GND + 60}`} style={{ display: "block", background: "#070d18" }}>
        <defs>
          <pattern id="egrid" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="0.5" fill="#1e2a3a" />
          </pattern>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a5c" />
            <stop offset="100%" stopColor="#0d1929" />
          </linearGradient>
        </defs>
        <rect width={W} height={GND + 60} fill="url(#egrid)" />

        {/* Ground hatch */}
        <line x1={20} y1={GND + 10} x2={W - 20} y2={GND + 10} stroke="#1e2a3a" strokeWidth={2} />
        {[...Array(20)].map((_, i) => (
          <line key={i} x1={20 + i * 30} y1={GND + 10} x2={14 + i * 30} y2={GND + 18}
            stroke="#1e2a3a" strokeWidth={1} />
        ))}

        {/* Building body */}
        <rect x={bldX} y={GND + 10 - totalH} width={bldW} height={totalH}
          fill="url(#wallGrad)" stroke="#00c6e0" strokeWidth={WALL_T} />

        {/* Floor division lines */}
        {Array.from({ length: stories - 1 }).map((_, i) => (
          <line key={i}
            x1={bldX} y1={GND + 10 - (i + 1) * STORY_H}
            x2={bldX + bldW} y2={GND + 10 - (i + 1) * STORY_H}
            stroke="#1e293b" strokeWidth={1} strokeDasharray="6,3" />
        ))}

        {/* Windows per story */}
        {Array.from({ length: stories }).map((_, si) => (
          winCols.map((wx, wi) => {
            if (wi === 2 && si === 0) return null; // skip door position
            const wh = isModern ? 22 : 18;
            const ww = isModern ? 30 : 24;
            const wy = GND + 10 - (si + 1) * STORY_H + 12;
            return (
              <g key={`w${si}-${wi}`}>
                <rect x={wx} y={wy} width={ww} height={wh}
                  fill="#00c6e018" stroke="#00c6e066" strokeWidth={1} />
                {/* window cross */}
                <line x1={wx + ww / 2} y1={wy} x2={wx + ww / 2} y2={wy + wh} stroke="#00c6e033" strokeWidth={0.7} />
                <line x1={wx} y1={wy + wh / 2} x2={wx + ww} y2={wy + wh / 2} stroke="#00c6e033" strokeWidth={0.7} />
                {/* sill */}
                <line x1={wx - 2} y1={wy + wh + 1} x2={wx + ww + 2} y2={wy + wh + 1} stroke="#00c6e044" strokeWidth={1.5} />
              </g>
            );
          })
        ))}

        {/* Front door */}
        <rect x={bldX + 215} y={GND + 10 - 40} width={50} height={40}
          fill="#0a0f1a" stroke="#00c6e0" strokeWidth={1.5} />
        <path d={`M ${bldX + 215} ${GND + 10 - 40} Q ${bldX + 240} ${GND + 10 - 60} ${bldX + 265} ${GND + 10 - 40}`}
          fill="none" stroke="#00c6e055" strokeWidth={1} />
        <line x1={bldX + 240} y1={GND + 10 - 40} x2={bldX + 240} y2={GND + 10 - 10}
          stroke="#00c6e033" strokeWidth={0.8} />
        {/* door step */}
        <rect x={bldX + 210} y={GND + 10} width={60} height={5} fill="#1e293b" stroke="#00c6e044" strokeWidth={1} />

        {/* Garage door */}
        {hasGarage && (
          <g>
            <rect x={bldX + 360} y={GND + 10 - STORY_H + 6} width={80} height={STORY_H - 6}
              fill="#0d1929" stroke="#00c6e055" strokeWidth={1} />
            {[...Array(5)].map((_, i) => (
              <line key={i} x1={bldX + 360} y1={GND + 10 - STORY_H + 6 + i * 12}
                x2={bldX + 440} y2={GND + 10 - STORY_H + 6 + i * 12}
                stroke="#1e293b" strokeWidth={0.8} />
            ))}
          </g>
        )}

        {/* Balcony parapet upper floor */}
        {hasBalcony && stories > 1 && (
          <g>
            <rect x={bldX + 100} y={GND + 10 - stories * STORY_H - 10} width={120} height={10}
              fill="#0d1929" stroke="#00c6e0" strokeWidth={1} />
            {[...Array(8)].map((_, i) => (
              <line key={i} x1={bldX + 106 + i * 14} y1={GND + 10 - stories * STORY_H}
                x2={bldX + 106 + i * 14} y2={GND + 10 - stories * STORY_H - 10}
                stroke="#00c6e066" strokeWidth={1} />
            ))}
          </g>
        )}

        {/* Roof */}
        {isModern ? (
          // flat parapet roof
          <g>
            <rect x={bldX - 6} y={GND + 10 - totalH - 12} width={bldW + 12} height={12}
              fill="#0d192e" stroke="#00c6e0" strokeWidth={1.5} />
          </g>
        ) : (
          // pitched roof
          <polygon
            points={`${bldX - 10},${GND + 10 - totalH} ${bldX + bldW / 2},${GND + 10 - totalH - roofH} ${bldX + bldW + 10},${GND + 10 - totalH}`}
            fill="#0d192e" stroke="#00c6e0" strokeWidth={1.5} />
        )}

        {/* Floor labels left */}
        {Array.from({ length: stories }).map((_, i) => (
          <g key={i}>
            <text x={bldX - 8} y={GND + 10 - i * STORY_H - STORY_H / 2}
              textAnchor="end" dominantBaseline="central"
              fill="#4a6480" fontSize={9} fontFamily="monospace">F{i + 1}</text>
            {/* height dim right */}
            <line x1={bldX + bldW + 14} y1={GND + 10 - (i + 1) * STORY_H}
              x2={bldX + bldW + 14} y2={GND + 10 - i * STORY_H}
              stroke="#445566" strokeWidth={0.8} />
            <line x1={bldX + bldW + 10} y1={GND + 10 - (i + 1) * STORY_H}
              x2={bldX + bldW + 18} y2={GND + 10 - (i + 1) * STORY_H}
              stroke="#445566" strokeWidth={0.8} />
            <line x1={bldX + bldW + 10} y1={GND + 10 - i * STORY_H}
              x2={bldX + bldW + 18} y2={GND + 10 - i * STORY_H}
              stroke="#445566" strokeWidth={0.8} />
            <text x={bldX + bldW + 28} y={GND + 10 - i * STORY_H - STORY_H / 2}
              textAnchor="middle" dominantBaseline="central"
              fill="#445566" fontSize={8} fontFamily="monospace">3.00m</text>
          </g>
        ))}

        {/* Total width dim below */}
        <line x1={bldX} y1={GND + 26} x2={bldX + bldW} y2={GND + 26}
          stroke="#445566" strokeWidth={0.8} />
        <line x1={bldX} y1={GND + 22} x2={bldX} y2={GND + 30}
          stroke="#445566" strokeWidth={0.8} />
        <line x1={bldX + bldW} y1={GND + 22} x2={bldX + bldW} y2={GND + 30}
          stroke="#445566" strokeWidth={0.8} />
        <text x={bldX + bldW / 2} y={GND + 40} textAnchor="middle"
          fill="#445566" fontSize={9} fontFamily="monospace">
          {totalWidthM} m
        </text>

        {/* Total height dim */}
        <line x1={bldX - 22} y1={GND + 10 - totalH} x2={bldX - 22} y2={GND + 10}
          stroke="#445566" strokeWidth={0.8} />
        <text x={bldX - 30} y={GND + 10 - totalH / 2}
          textAnchor="middle" dominantBaseline="central"
          fill="#445566" fontSize={8} fontFamily="monospace"
          transform={`rotate(-90, ${bldX - 30}, ${GND + 10 - totalH / 2})`}>
          {(stories * 3.0).toFixed(1)} m
        </text>

        {/* View label */}
        <text x={bldX + bldW / 2} y={GND + 56} textAnchor="middle"
          fill="#4a6480" fontSize={9} fontFamily="monospace" letterSpacing={2}>
          ELEVATION A-A
        </text>

        {/* North arrow */}
        <g transform={`translate(${W - 28}, 22)`}>
          <circle r={12} fill="#0d1929" stroke="#1e2a3a" strokeWidth={1} />
          <polygon points="0,-9 -4,5 0,3 4,5" fill="#00c6e0" />
          <text y={20} textAnchor="middle" fill="#4a6480" fontSize={8} fontFamily="monospace">N</text>
        </g>
      </svg>

      {/* Legend */}
      <div style={{ padding: "8px 14px", borderTop: "1px solid #1e293b", display: "flex", gap: 20 }}>
        {[["Wall", "#00c6e0"], ["Window", "#00c6e066"], ["Door", "#00c6e0"], ["Ground", "#1e2a3a"]].map(([l, c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 12, height: 8, background: c, borderRadius: 2, opacity: 0.9 }} />
            <span style={{ fontSize: 10, color: "#4a6480", fontFamily: "monospace" }}>{l}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#4a6480", fontFamily: "monospace" }}>
          {stories} floor{stories > 1 ? "s" : ""} · {(stories * 3.0).toFixed(1)}m total height
        </span>
      </div>
    </div>
  );
}

// ── Side Elevation (left or right) ──────────────────────────────────────────
function SideElevation({ rooms, stories, styleTag, side }: { rooms: Room[]; stories: number; styleTag: string; side: "LEFT" | "RIGHT" }) {
  const W = 420, GND = 160, STORY_H = 56, WALL_T = 2;
  const totalH = stories * STORY_H;
  const bldX = 50, bldW = 300;
  const isModern = styleTag?.toLowerCase().includes("modern") || styleTag?.toLowerCase().includes("contemporary");
  const hasBalcony = rooms.some(r => r.name.toLowerCase().includes("balcony"));
  const depthRooms = rooms.filter(r => r.floor === 1);
  const depthM = Math.round(depthRooms.reduce((s, r) => s + Math.sqrt(r.area) * 0.6, 0) * 10) / 10;
  // 2 window columns on side
  const winCols = [bldX + 60, bldX + 180];

  return (
    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden", flex: 1 }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#00c6e0" }}>{side} ELEVATION</span>
        <span style={{ fontSize: 10, color: "#4a6480" }}>Scale 1:50</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${GND + 50}`} style={{ display: "block", background: "#070d18" }}>
        <defs>
          <pattern id={`sgrid${side}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="0.5" fill="#1e2a3a" />
          </pattern>
          <linearGradient id={`swg${side}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a3a5c" />
            <stop offset="100%" stopColor="#0d1929" />
          </linearGradient>
        </defs>
        <rect width={W} height={GND + 50} fill={`url(#sgrid${side})`} />

        {/* Ground */}
        <line x1={20} y1={GND + 8} x2={W - 20} y2={GND + 8} stroke="#1e2a3a" strokeWidth={2} />
        {[...Array(13)].map((_, i) => (
          <line key={i} x1={20 + i * 28} y1={GND + 8} x2={14 + i * 28} y2={GND + 16} stroke="#1e2a3a" strokeWidth={1} />
        ))}

        {/* Building body */}
        <rect x={bldX} y={GND + 8 - totalH} width={bldW} height={totalH}
          fill={`url(#swg${side})`} stroke="#00c6e0" strokeWidth={WALL_T} />

        {/* Floor lines */}
        {Array.from({ length: stories - 1 }).map((_, i) => (
          <line key={i} x1={bldX} y1={GND + 8 - (i + 1) * STORY_H}
            x2={bldX + bldW} y2={GND + 8 - (i + 1) * STORY_H}
            stroke="#1e293b" strokeWidth={1} strokeDasharray="5,3" />
        ))}

        {/* Windows */}
        {Array.from({ length: stories }).map((_, si) =>
          winCols.map((wx, wi) => {
            const ww = isModern ? 28 : 22, wh = isModern ? 20 : 16;
            const wy = GND + 8 - (si + 1) * STORY_H + 14;
            return (
              <g key={`sw${si}${wi}`}>
                <rect x={wx} y={wy} width={ww} height={wh} fill="#00c6e018" stroke="#00c6e066" strokeWidth={1} />
                <line x1={wx + ww / 2} y1={wy} x2={wx + ww / 2} y2={wy + wh} stroke="#00c6e033" strokeWidth={0.7} />
                <line x1={wx} y1={wy + wh / 2} x2={wx + ww} y2={wy + wh / 2} stroke="#00c6e033" strokeWidth={0.7} />
                <line x1={wx - 2} y1={wy + wh + 1} x2={wx + ww + 2} y2={wy + wh + 1} stroke="#00c6e044" strokeWidth={1.5} />
              </g>
            );
          })
        )}

        {/* Side door (only right side has a side entrance if needed) */}
        {side === "RIGHT" && (
          <g>
            <rect x={bldX + bldW - 36} y={GND + 8 - 36} width={28} height={36}
              fill="#0a0f1a" stroke="#00c6e066" strokeWidth={1} />
            <line x1={bldX + bldW - 22} y1={GND + 8 - 36} x2={bldX + bldW - 22} y2={GND + 8 - 8}
              stroke="#00c6e033" strokeWidth={0.8} />
          </g>
        )}

        {/* Balcony on left upper */}
        {hasBalcony && stories > 1 && (
          <g>
            <rect x={bldX - 14} y={GND + 8 - stories * STORY_H} width={14} height={STORY_H - 8}
              fill="none" stroke="#00c6e055" strokeWidth={1} />
            {[...Array(4)].map((_, i) => (
              <line key={i} x1={bldX - 14} y1={GND + 8 - stories * STORY_H + 8 + i * 10}
                x2={bldX} y2={GND + 8 - stories * STORY_H + 8 + i * 10}
                stroke="#00c6e033" strokeWidth={0.7} />
            ))}
          </g>
        )}

        {/* Roof */}
        {isModern ? (
          <rect x={bldX - 4} y={GND + 8 - totalH - 10} width={bldW + 8} height={10}
            fill="#0d192e" stroke="#00c6e0" strokeWidth={1.5} />
        ) : (
          <polygon
            points={`${bldX - 8},${GND + 8 - totalH} ${bldX + bldW / 2},${GND + 8 - totalH - 32} ${bldX + bldW + 8},${GND + 8 - totalH}`}
            fill="#0d192e" stroke="#00c6e0" strokeWidth={1.5} />
        )}

        {/* Height dims right */}
        {Array.from({ length: stories }).map((_, i) => (
          <g key={i}>
            <line x1={bldX + bldW + 12} y1={GND + 8 - (i + 1) * STORY_H}
              x2={bldX + bldW + 12} y2={GND + 8 - i * STORY_H} stroke="#445566" strokeWidth={0.8} />
            <line x1={bldX + bldW + 8} y1={GND + 8 - (i + 1) * STORY_H}
              x2={bldX + bldW + 16} y2={GND + 8 - (i + 1) * STORY_H} stroke="#445566" strokeWidth={0.8} />
            <text x={bldX + bldW + 24} y={GND + 8 - i * STORY_H - STORY_H / 2}
              textAnchor="start" dominantBaseline="central" fill="#445566" fontSize={8} fontFamily="monospace">3.00m</text>
          </g>
        ))}

        {/* Depth dim bottom */}
        <line x1={bldX} y1={GND + 22} x2={bldX + bldW} y2={GND + 22} stroke="#445566" strokeWidth={0.8} />
        <line x1={bldX} y1={GND + 18} x2={bldX} y2={GND + 26} stroke="#445566" strokeWidth={0.8} />
        <line x1={bldX + bldW} y1={GND + 18} x2={bldX + bldW} y2={GND + 26} stroke="#445566" strokeWidth={0.8} />
        <text x={bldX + bldW / 2} y={GND + 36} textAnchor="middle" fill="#445566" fontSize={8} fontFamily="monospace">
          {depthM} m
        </text>

        <text x={bldX + bldW / 2} y={GND + 46} textAnchor="middle" fill="#4a6480" fontSize={8} fontFamily="monospace" letterSpacing={2}>
          {side} ELEVATION
        </text>
      </svg>
    </div>
  );
}

// ── Back Elevation ────────────────────────────────────────────────────────────
function BackElevation({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  const W = 640, GND = 160, STORY_H = 56, WALL_T = 2;
  const totalH = stories * STORY_H;
  const bldX = 60, bldW = 480;
  const isModern = styleTag?.toLowerCase().includes("modern") || styleTag?.toLowerCase().includes("contemporary");
  const hasBalcony = rooms.some(r => r.name.toLowerCase().includes("balcony"));
  // back has fewer windows, different arrangement
  const winCols = [bldX + 40, bldX + 140, bldX + 260, bldX + 380];
  const totalWidthM = Math.round(rooms.filter(r => r.floor === 1).reduce((s, r) => s + Math.sqrt(r.area), 0) * 0.9 * 10) / 10;

  return (
    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#00c6e0" }}>REAR ELEVATION — VIEW B</span>
        <span style={{ fontSize: 10, color: "#4a6480" }}>Scale 1:50  ·  All dims in metres</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${GND + 50}`} style={{ display: "block", background: "#070d18" }}>
        <defs>
          <pattern id="bgrid" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="0.5" fill="#1e2a3a" />
          </pattern>
          <linearGradient id="bwg" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2a3c" />
            <stop offset="100%" stopColor="#0d1929" />
          </linearGradient>
        </defs>
        <rect width={W} height={GND + 50} fill="url(#bgrid)" />

        {/* Ground */}
        <line x1={20} y1={GND + 8} x2={W - 20} y2={GND + 8} stroke="#1e2a3a" strokeWidth={2} />
        {[...Array(20)].map((_, i) => (
          <line key={i} x1={20 + i * 30} y1={GND + 8} x2={14 + i * 30} y2={GND + 16} stroke="#1e2a3a" strokeWidth={1} />
        ))}

        {/* Building body */}
        <rect x={bldX} y={GND + 8 - totalH} width={bldW} height={totalH}
          fill="url(#bwg)" stroke="#445566" strokeWidth={WALL_T} />

        {/* Floor division */}
        {Array.from({ length: stories - 1 }).map((_, i) => (
          <line key={i} x1={bldX} y1={GND + 8 - (i + 1) * STORY_H}
            x2={bldX + bldW} y2={GND + 8 - (i + 1) * STORY_H}
            stroke="#1e293b" strokeWidth={1} strokeDasharray="6,3" />
        ))}

        {/* Back windows — smaller, different pattern */}
        {Array.from({ length: stories }).map((_, si) =>
          winCols.map((wx, wi) => {
            const ww = 26, wh = 18;
            const wy = GND + 8 - (si + 1) * STORY_H + 16;
            return (
              <g key={`bw${si}${wi}`}>
                <rect x={wx} y={wy} width={ww} height={wh} fill="#00c6e010" stroke="#44556688" strokeWidth={1} />
                <line x1={wx + ww / 2} y1={wy} x2={wx + ww / 2} y2={wy + wh} stroke="#44556644" strokeWidth={0.7} />
                <line x1={wx} y1={wy + wh / 2} x2={wx + ww} y2={wy + wh / 2} stroke="#44556644" strokeWidth={0.7} />
              </g>
            );
          })
        )}

        {/* Back patio/utility door */}
        <rect x={bldX + 80} y={GND + 8 - 34} width={36} height={34}
          fill="#0a0f1a" stroke="#44556688" strokeWidth={1.5} />
        <line x1={bldX + 98} y1={GND + 8 - 34} x2={bldX + 98} y2={GND + 8 - 6}
          stroke="#44556644" strokeWidth={0.8} />

        {/* Balcony rear */}
        {hasBalcony && stories > 1 && (
          <g>
            <rect x={bldX + 280} y={GND + 8 - stories * STORY_H} width={110} height={12}
              fill="#0d1929" stroke="#44556688" strokeWidth={1} />
            {[...Array(7)].map((_, i) => (
              <line key={i} x1={bldX + 286 + i * 14} y1={GND + 8 - stories * STORY_H + 12}
                x2={bldX + 286 + i * 14} y2={GND + 8 - stories * STORY_H}
                stroke="#44556644" strokeWidth={1} />
            ))}
          </g>
        )}

        {/* Service pipes / drainage (rear detail) */}
        <line x1={bldX + bldW - 20} y1={GND + 8 - totalH}
          x2={bldX + bldW - 20} y2={GND + 8}
          stroke="#1e2a3a" strokeWidth={3} strokeDasharray="1,4" />

        {/* Roof */}
        {isModern ? (
          <rect x={bldX - 4} y={GND + 8 - totalH - 10} width={bldW + 8} height={10}
            fill="#0d192e" stroke="#445566" strokeWidth={1.5} />
        ) : (
          <polygon
            points={`${bldX - 10},${GND + 8 - totalH} ${bldX + bldW / 2},${GND + 8 - totalH - 34} ${bldX + bldW + 10},${GND + 8 - totalH}`}
            fill="#0d192e" stroke="#445566" strokeWidth={1.5} />
        )}

        {/* Height dims */}
        {Array.from({ length: stories }).map((_, i) => (
          <g key={i}>
            <line x1={bldX + bldW + 14} y1={GND + 8 - (i + 1) * STORY_H}
              x2={bldX + bldW + 14} y2={GND + 8 - i * STORY_H} stroke="#445566" strokeWidth={0.8} />
            <line x1={bldX + bldW + 10} y1={GND + 8 - (i + 1) * STORY_H}
              x2={bldX + bldW + 18} y2={GND + 8 - (i + 1) * STORY_H} stroke="#445566" strokeWidth={0.8} />
            <text x={bldX + bldW + 28} y={GND + 8 - i * STORY_H - STORY_H / 2}
              textAnchor="start" dominantBaseline="central" fill="#445566" fontSize={8} fontFamily="monospace">3.00m</text>
          </g>
        ))}

        {/* Width dim */}
        <line x1={bldX} y1={GND + 22} x2={bldX + bldW} y2={GND + 22} stroke="#445566" strokeWidth={0.8} />
        <line x1={bldX} y1={GND + 18} x2={bldX} y2={GND + 26} stroke="#445566" strokeWidth={0.8} />
        <line x1={bldX + bldW} y1={GND + 18} x2={bldX + bldW} y2={GND + 26} stroke="#445566" strokeWidth={0.8} />
        <text x={bldX + bldW / 2} y={GND + 36} textAnchor="middle" fill="#445566" fontSize={9} fontFamily="monospace">
          {totalWidthM} m
        </text>

        <text x={bldX + bldW / 2} y={GND + 46} textAnchor="middle" fill="#4a6480" fontSize={8} fontFamily="monospace" letterSpacing={2}>
          REAR ELEVATION B-B
        </text>
      </svg>
    </div>
  );
}

// ── Isometric 3D View ─────────────────────────────────────────────────────────
function Iso3DView({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  const isModern = styleTag?.toLowerCase().includes("modern") || styleTag?.toLowerCase().includes("contemporary");
  const hasGarage = rooms.some(r => r.name.toLowerCase().includes("garage"));
  const hasBalcony = rooms.some(r => r.name.toLowerCase().includes("balcony"));

  // Rotation state
  const [rotY, setRotY] = useState(0); // rotation around Y axis in radians
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, rot: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Isometric projection helpers with rotation
  const SX = 28, SY = 14; // scale x,y for iso grid unit
  const SH = 36; // scale vertical
  const cx = 320, cy = 340; // canvas center

  // iso project: (gx, gy, gz) → (px, py) with Y-axis rotation
  function iso(gx: number, gy: number, gz: number) {
    // Apply Y rotation to gx, gy (ground plane rotation)
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    const rx = gx * cosR - gy * sinR;
    const ry = gx * sinR + gy * cosR;
    return {
      x: cx + (rx - ry) * SX,
      y: cy + (rx + ry) * SY - gz * SH,
    };
  }

  // Mouse handlers for rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, rot: rotY });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const sensitivity = 0.01;
    setRotY(dragStart.rot + deltaX * sensitivity);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, rot: rotY });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const sensitivity = 0.01;
    setRotY(dragStart.rot + deltaX * sensitivity);
  };
  const handleTouchEnd = () => setIsDragging(false);

  // Rotation button controls
  const rotLeft = () => setRotY(r => r - Math.PI / 8);
  const rotRight = () => setRotY(r => r + Math.PI / 8);
  const rotReset = () => setRotY(0);

  // Building dims in grid units
  const BW = 6, BD = 5; // width, depth
  const BH = stories;
  const roofH = isModern ? 0.3 : 1.2;

  // Helper: polygon points string from array of {x,y}
  function pts(points: { x: number; y: number }[]) {
    return points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  }

  // Front face corners
  const A = iso(0, 0, 0), B = iso(BW, 0, 0), C = iso(BW, 0, BH), D = iso(0, 0, BH);
  // Right face
  const E = iso(BW, BD, 0), F = iso(BW, BD, BH);
  // Top face
  const T1 = iso(0, 0, BH), T2 = iso(BW, 0, BH), T3 = iso(BW, BD, BH), T4 = iso(0, BD, BH);

  // Roof ridge
  const R1 = iso(0, BD / 2, BH + roofH);
  const R2 = iso(BW, BD / 2, BH + roofH);

  // Garage protrusion (right side)
  const GW = 2, GD = 2;
  const ga = iso(BW, 0, 0), gb = iso(BW + GW, 0, 0);
  const gc = iso(BW + GW, GD, 0), gd = iso(BW, GD, 0);
  const ge = iso(BW, 0, 1.2), gf = iso(BW + GW, 0, 1.2);
  const gg = iso(BW + GW, GD, 1.2), gh = iso(BW, GD, 1.2);

  // Balcony slab (front, upper floor)
  const balW = 2.5, balD = 0.8;
  const ba = iso(1.5, -balD, BH - 1), bb = iso(1.5 + balW, -balD, BH - 1);
  const bc = iso(1.5 + balW, 0, BH - 1), bd2 = iso(1.5, 0, BH - 1);
  const bTop = iso(1.5, -balD, BH - 1 + 0.06);
  const bTop2 = iso(1.5 + balW, -balD, BH - 1 + 0.06);

  // Window helper: draws an iso window on front face at (wx_grid, floor)
  function isoWin(wx: number, fl: number, w = 0.7, h = 0.55) {
    const base = fl - 0.8;
    const tl = iso(wx, 0, base + h);
    const tr = iso(wx + w, 0, base + h);
    const br = iso(wx + w, 0, base);
    const bl = iso(wx, 0, base);
    const mid = iso(wx + w / 2, 0, base);
    const midT = iso(wx + w / 2, 0, base + h);
    const midL = iso(wx, 0, base + h / 2);
    const midR = iso(wx + w, 0, base + h / 2);
    return { pts: pts([tl, tr, br, bl]), crossV: `${mid.x.toFixed(1)},${mid.y.toFixed(1)} ${midT.x.toFixed(1)},${midT.y.toFixed(1)}`, crossH: `${midL.x.toFixed(1)},${midL.y.toFixed(1)} ${midR.x.toFixed(1)},${midR.y.toFixed(1)}` };
  }

  // Right-face windows
  function isoWinRight(wy: number, fl: number, w = 0.7, h = 0.55) {
    const base = fl - 0.8;
    const tl = iso(BW, wy, base + h);
    const tr = iso(BW, wy + w, base + h);
    const br = iso(BW, wy + w, base);
    const bl = iso(BW, wy, base);
    return pts([tl, tr, br, bl]);
  }

  const frontWins = [
    ...Array.from({ length: stories }, (_, fl) => [
      isoWin(0.6, fl + 1),
      isoWin(2.2, fl + 1),
      isoWin(3.8, fl + 1),
      isoWin(5.0, fl + 1),
    ]).flat()
  ];

  const W = 680, H = 480;
  const rotDeg = Math.round((rotY * 180) / Math.PI);

  return (
    <div style={{ background: "#070d18", border: "2px solid #00c6e044", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0f1a" }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#00c6e0" }}>🏠 3D ISOMETRIC VIEW — FINAL DESIGN</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Rotation controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={rotLeft} title="Rotate left"
              style={{ width: 28, height: 28, background: "#0d1929", border: "1px solid #00c6e044", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#00c6e0" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6e0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#00c6e044"; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span style={{ fontSize: 11, color: "#4a6480", minWidth: 50, textAlign: "center" }}>{rotDeg}°</span>
            <button onClick={rotRight} title="Rotate right"
              style={{ width: 28, height: 28, background: "#0d1929", border: "1px solid #00c6e044", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#00c6e0" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6e0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#00c6e044"; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <button onClick={rotReset} title="Reset rotation"
              style={{ width: 28, height: 28, background: "#0d1929", border: "1px solid #00c6e044", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#00c6e0", marginLeft: 4 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00c6e0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#00c6e044"; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
          <span style={{ fontSize: 10, color: "#4a6480" }}>Drag to rotate</span>
        </div>
      </div>
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: "linear-gradient(160deg,#050c18 60%,#071428)", cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <defs>
          <radialGradient id="sky" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#071428" />
            <stop offset="100%" stopColor="#020810" />
          </radialGradient>
          <linearGradient id="frontFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a5c" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0d1929" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="sideFace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0f2236" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#071828" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="topFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a5a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#152a46" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width={W} height={H} fill="url(#sky)" />

        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <circle key={i} cx={20 + (i * 67) % (W - 40)} cy={10 + (i * 43) % 120} r={0.7} fill="#ffffff" opacity={0.3 + (i % 4) * 0.15} />
        ))}

        {/* Ground shadow ellipse */}
        <ellipse cx={cx + 20} cy={cy + 10} rx={220} ry={28} fill="#000000" opacity={0.45} />

        {/* Ground plane grid */}
        {[-2,-1,0,1,2,3,4,5,6,7,8].map(gx => {
          const s = iso(gx, -1, 0), e = iso(gx, 8, 0);
          return <line key={`gx${gx}`} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#0d1f30" strokeWidth={0.6} />;
        })}
        {[-1,0,1,2,3,4,5,6,7].map(gy => {
          const s = iso(-1, gy, 0), e = iso(9, gy, 0);
          return <line key={`gy${gy}`} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#0d1f30" strokeWidth={0.6} />;
        })}

        {/* Garage extension */}
        {hasGarage && (
          <g>
            {/* floor */}
            <polygon points={pts([ga, gb, gc, gd])} fill="#0d1929" stroke="#00c6e033" strokeWidth={0.8} />
            {/* front */}
            <polygon points={pts([ga, gb, gf, ge])} fill="url(#frontFace)" stroke="#00c6e044" strokeWidth={0.8} />
            {/* side */}
            <polygon points={pts([gb, gc, gg, gf])} fill="url(#sideFace)" stroke="#00c6e033" strokeWidth={0.8} />
            {/* top */}
            <polygon points={pts([ge, gf, gg, gh])} fill="url(#topFace)" stroke="#00c6e033" strokeWidth={0.8} />
            {/* garage door lines */}
            {[0.3,0.5,0.7,0.9].map(frac => {
              const l = iso(BW, frac * GD, 0);
              const lt = iso(BW, frac * GD, 1.2);
              return <line key={frac} x1={l.x} y1={l.y} x2={lt.x} y2={lt.y} stroke="#00c6e022" strokeWidth={0.6} />;
            })}
          </g>
        )}

        {/* Right face */}
        <polygon points={pts([B, E, F, C])} fill="url(#sideFace)" stroke="#00c6e066" strokeWidth={1} />

        {/* Right face windows */}
        {Array.from({ length: stories }, (_, fl) => [1.2, 3.2].map(wy => (
          <polygon key={`rw${fl}${wy}`} points={isoWinRight(wy, fl + 1)}
            fill="#00c6e018" stroke="#00c6e055" strokeWidth={0.8} />
        ))).flat()}

        {/* Front face */}
        <polygon points={pts([A, B, C, D])} fill="url(#frontFace)" stroke="#00c6e0" strokeWidth={1.5} filter="url(#glow)" />

        {/* Front windows */}
        {frontWins.map((w, i) => (
          <g key={i}>
            <polygon points={w.pts} fill="#00c6e020" stroke="#00c6e077" strokeWidth={0.8} />
            <polyline points={w.crossV} fill="none" stroke="#00c6e033" strokeWidth={0.5} />
            <polyline points={w.crossH} fill="none" stroke="#00c6e033" strokeWidth={0.5} />
          </g>
        ))}

        {/* Front door */}
        {(() => {
          const dl = iso(2.6, 0, 0), dr = iso(3.4, 0, 0);
          const dlt = iso(2.6, 0, 1.0), drt = iso(3.4, 0, 1.0);
          const dmid = iso(3.0, 0, 0), dmidT = iso(3.0, 0, 1.0);
          const handle = iso(3.2, 0, 0.45);
          return (
            <g>
              <polygon points={pts([dl, dr, drt, dlt])} fill="#050c18" stroke="#00c6e0" strokeWidth={1.5} />
              <polyline points={`${dmid.x},${dmid.y} ${dmidT.x},${dmidT.y}`} stroke="#00c6e044" strokeWidth={0.7} fill="none" />
              <circle cx={handle.x} cy={handle.y} r={2.5} fill="#00c6e0" opacity={0.7} />
              {/* arch above door */}
              <path d={`M ${dl.x} ${dl.y + (dlt.y - dl.y)} Q ${(dl.x + dr.x) / 2} ${dlt.y - 14} ${dr.x} ${dr.y + (drt.y - dr.y)}`}
                fill="none" stroke="#00c6e055" strokeWidth={1} />
            </g>
          );
        })()}

        {/* Balcony slab */}
        {hasBalcony && stories > 1 && (
          <g>
            <polygon points={pts([ba, bb, bc, bd2])} fill="#1a2a3c" stroke="#00c6e066" strokeWidth={1} />
            <polygon points={pts([bTop, bTop2, bb, ba])} fill="#1e3a5a" stroke="#00c6e055" strokeWidth={0.8} />
            {/* balcony railings */}
            {[0, 0.6, 1.2, 1.8, 2.4].map(off => {
              const bot = iso(1.5 + off, -balD, BH - 1);
              const top2 = iso(1.5 + off, -balD, BH - 0.7);
              return <line key={off} x1={bot.x} y1={bot.y} x2={top2.x} y2={top2.y} stroke="#00c6e066" strokeWidth={1} />;
            })}
            <polyline points={pts([
              iso(1.5, -balD, BH - 0.7), iso(1.5 + balW, -balD, BH - 0.7),
              iso(1.5 + balW, 0, BH - 0.7), iso(1.5, 0, BH - 0.7),
            ])} fill="none" stroke="#00c6e088" strokeWidth={1.2} />
          </g>
        )}

        {/* Top face */}
        <polygon points={pts([T1, T2, T3, T4])} fill="url(#topFace)" stroke="#00c6e077" strokeWidth={1} />

        {/* Roof */}
        {isModern ? (
          <g>
            {/* flat roof parapet */}
            {[
              [iso(0, 0, BH + 0.22), iso(BW, 0, BH + 0.22), iso(BW, BD, BH + 0.22), iso(0, BD, BH + 0.22)],
            ].map((corners, i) => (
              <polygon key={i} points={pts(corners)} fill="#0d192e" stroke="#00c6e0" strokeWidth={1.5} />
            ))}
            {/* parapet walls */}
            <polygon points={pts([iso(0,0,BH), iso(BW,0,BH), iso(BW,0,BH+0.22), iso(0,0,BH+0.22)])}
              fill="#0d192e" stroke="#00c6e077" strokeWidth={1} />
            <polygon points={pts([iso(BW,0,BH), iso(BW,BD,BH), iso(BW,BD,BH+0.22), iso(BW,0,BH+0.22)])}
              fill="#08111e" stroke="#00c6e055" strokeWidth={1} />
          </g>
        ) : (
          <g>
            {/* pitched roof — 4 faces */}
            <polygon points={pts([iso(0,0,BH), iso(BW,0,BH), R2, R1])}
              fill="#0d192e" stroke="#00c6e0" strokeWidth={1.5} />
            <polygon points={pts([iso(BW,0,BH), iso(BW,BD,BH), iso(BW,BD/2,BH+roofH), R2])}
              fill="#08111e" stroke="#00c6e077" strokeWidth={1} />
            <polygon points={pts([iso(0,0,BH), R1, iso(0,BD/2,BH+roofH), iso(0,BD,BH)])}
              fill="#0a1520" stroke="#00c6e044" strokeWidth={1} />
            <polygon points={pts([iso(0,BD,BH), iso(BW,BD,BH), iso(BW,BD/2,BH+roofH), iso(0,BD/2,BH+roofH)])}
              fill="#0b1825" stroke="#00c6e055" strokeWidth={1} />
            {/* ridge line */}
            <line x1={R1.x} y1={R1.y} x2={R2.x} y2={R2.y} stroke="#00c6e0" strokeWidth={1.5} />
          </g>
        )}

        {/* Floor count annotation */}
        {Array.from({ length: stories }, (_, i) => {
          const label = iso(-0.5, BD / 2, i + 0.5);
          return (
            <text key={i} x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central"
              fill="#4a6480" fontSize={9} fontFamily="monospace">F{i + 1}</text>
          );
        })}

        {/* Axis labels */}
        {(() => {
          const xEnd = iso(BW + 1, 0, 0), yEnd = iso(0, BD + 1, 0), zEnd = iso(0, 0, BH + 0.8);
          const orig = iso(0, 0, 0);
          return (
            <g opacity={0.5}>
              <line x1={orig.x} y1={orig.y} x2={xEnd.x} y2={xEnd.y} stroke="#00c6e0" strokeWidth={0.8} strokeDasharray="3,2" />
              <text x={xEnd.x + 6} y={xEnd.y} fill="#00c6e0" fontSize={9} fontFamily="monospace">W</text>
              <line x1={orig.x} y1={orig.y} x2={yEnd.x} y2={yEnd.y} stroke="#a855f7" strokeWidth={0.8} strokeDasharray="3,2" />
              <text x={yEnd.x - 14} y={yEnd.y + 4} fill="#a855f7" fontSize={9} fontFamily="monospace">D</text>
              <line x1={orig.x} y1={orig.y} x2={zEnd.x} y2={zEnd.y} stroke="#22c55e" strokeWidth={0.8} strokeDasharray="3,2" />
              <text x={zEnd.x + 4} y={zEnd.y - 4} fill="#22c55e" fontSize={9} fontFamily="monospace">H</text>
            </g>
          );
        })()}

        {/* Building label */}
        <text x={cx} y={H - 18} textAnchor="middle" fill="#00c6e0" fontSize={12} fontWeight="bold" fontFamily="monospace" letterSpacing={3}>
          {styleTag?.toUpperCase() || "RESIDENTIAL DESIGN"}
        </text>
        <text x={cx} y={H - 6} textAnchor="middle" fill="#4a6480" fontSize={9} fontFamily="monospace">
          {stories} FLOOR{stories > 1 ? "S" : ""} · ISOMETRIC 3D VIEW
        </text>
      </svg>
    </div>
  );
}

// ── Real Construction - Finished House Visual ────────────────────────────────
function RealConstructionView({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  const isModern = styleTag?.toLowerCase().includes("modern") || styleTag?.toLowerCase().includes("contemporary");
  const hasGarage = rooms.some(r => r.name.toLowerCase().includes("garage"));
  const hasBalcony = rooms.some(r => r.name.toLowerCase().includes("balcony"));

  // Rotation state
  const [rotY, setRotY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, rot: 0 });

  const W = 720, H = 520;
  const cx = 360, cy = 380;

  // Colors for real construction materials
  const colors = {
    wall: isModern ? "#c9a87c" : "#d4b896",      // Real brick/stucco
    wallSide: isModern ? "#b89b6b" : "#c4a582",    // Darker side face
    wallTop: isModern ? "#a88b5b" : "#b49472",     // Top face
    roof: isModern ? "#2d3436" : "#8b4513",        // Modern dark flat / Traditional terracotta
    roofSide: isModern ? "#1a1e20" : "#654321",
    window: "#1a252f",                               // Dark glass
    windowReflect: "#2a3a4a",                       // Reflection
    door: "#4a3728",                                 // Wood
    doorFrame: "#5c4a3d",
    balcony: "#e8e8e8",                              // Concrete
    garage: "#3d3d3d",                               // Dark garage door
    ground: "#3d5c3d",                               // Grass/landscaping
    groundShadow: "#2d4a2d",
  };

  // Isometric projection with rotation
  const SX = 26, SY = 13;
  const SH = 32;

  function iso(gx: number, gy: number, gz: number) {
    // Apply Y rotation
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    const rx = gx * cosR - gy * sinR;
    const ry = gx * sinR + gy * cosR;
    return {
      x: cx + (rx - ry) * SX,
      y: cy + (rx + ry) * SY - gz * SH,
    };
  }

  // Mouse handlers for rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, rot: rotY });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const sensitivity = 0.01;
    setRotY(dragStart.rot + deltaX * sensitivity);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, rot: rotY });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
  return (
    <div style={{ background: "#0a0f1a", border: "2px solid #00c6e044", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0f1a" }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#22c55e" }}>🏡 REAL CONSTRUCTION — FINISHED HOUSE</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Driveway */}
        <polygon points={pts([iso(BW+2, -1, 0), iso(BW+5, -1, 0), iso(BW+5, 3, 0), iso(BW+2, 3, 0)])} fill="#808080" stroke="#606060" strokeWidth="0.5" />

        {/* Sun effect */}
        <circle cx={W - 60} cy="60" r="40" fill="#ffd700" opacity="0.3" />

        {/* Labels */}
        <text x={cx} y={H - 20} textAnchor="middle" fill="#2d4a2d" fontSize="12" fontWeight="bold" fontFamily="sans-serif">FINISHED CONSTRUCTION</text>
        <text x={cx} y={H - 6} textAnchor="middle" fill="#4a6a4a" fontSize="10" fontFamily="sans-serif">{styleTag?.toUpperCase() || "RESIDENTIAL"} · {stories} FLOOR{stories > 1 ? "S" : ""}</text>
      </svg>
    </div>
  );
}

// ── Final Presentation ───────────────────────────────────────────────────────
function FinalPresentation({ rooms, stories, styleTag, option }: { rooms: Room[]; stories: number; styleTag: string; option: Option }) {
  const isModern = styleTag?.toLowerCase().includes("modern") || styleTag?.toLowerCase().includes("contemporary");
  const hasBalcony = rooms.some(r => r.name.toLowerCase().includes("balcony"));
  const hasGarage = rooms.some(r => r.name.toLowerCase().includes("garage"));

  // Group rooms by floor
  const floorRooms = (floor: number) => rooms.filter(r => r.floor === floor);
  const totalArea = rooms.reduce((s, r) => s + r.area, 0);

  // Sample interior room types for gallery
  const interiorRooms = [
    { name: "Living Room", icon: "🛋️", color: "#c9a87c" },
    { name: "Dining", icon: "🍽️", color: "#a08060" },
    { name: "Kitchen", icon: "👨‍🍳", color: "#d4b896" },
    { name: "Master Bedroom", icon: "🛏️", color: "#b8a090" },
  ].filter(ir => rooms.some(r => r.name.toLowerCase().includes(ir.name.toLowerCase())));

  return (
    <div style={{ background: "#0a0f1a", border: "2px solid #22c55e44", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d1420" }}>
        <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, color: "#22c55e" }}>📸 FINAL PRESENTATION — PHOTOREALISTIC RENDER</span>
        <span style={{ fontSize: 10, color: "#4a6480" }}>ADDIS ABABA, ETHIOPIA · {new Date().getFullYear()}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {/* Left: Exterior Hero Render */}
        <div style={{ background: "linear-gradient(135deg, #87ceeb 0%, #e0f6ff 50%, #f5f5dc 100%)", position: "relative", minHeight: 400 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80" 
            alt="Final Photorealistic Render"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 400 }}
          />
        </div>

        {/* Right: Floor Plans */}
        <div style={{ background: "#f5f5f5", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#2c3e50", letterSpacing: 1 }}>FLOOR PLANS</div>
          
          {/* Ground Floor */}
          <div style={{ background: "#fff", borderRadius: 8, padding: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 8 }}>GROUND FLOOR (F1) — {floorRooms(1).reduce((s, r) => s + r.area, 0)}m²</div>
            <svg width="100%" height="140" viewBox="0 0 300 140">
              {/* Simple floor plan representation */}
              <rect x="10" y="10" width="280" height="120" fill="#fafafa" stroke="#333" strokeWidth="2" />
              {/* Rooms */}
              {floorRooms(1).slice(0, 4).map((r, i) => {
                const x = 15 + (i % 2) * 135;
                const y = 15 + Math.floor(i / 2) * 55;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width="125" height="50" fill={roomFill(r.name)} stroke={roomStroke(r.name)} strokeWidth="1" />
                    <text x={x + 62} y={y + 20} textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">{r.name.length > 12 ? r.name.slice(0, 11) + "…" : r.name}</text>
                    <text x={x + 62} y={y + 35} textAnchor="middle" fill="#666" fontSize="7">{r.area}m²</text>
                    <text x={x + 10} y={y + 12} fill="#333" fontSize="8" fontWeight="bold">0{i + 1}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* First Floor */}
          {stories > 1 && (
            <div style={{ background: "#fff", borderRadius: 8, padding: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 8 }}>FIRST FLOOR (F2) — {floorRooms(2).reduce((s, r) => s + r.area, 0)}m²</div>
              <svg width="100%" height="100" viewBox="0 0 300 100">
                <rect x="10" y="10" width="280" height="80" fill="#fafafa" stroke="#333" strokeWidth="2" />
                {floorRooms(2).slice(0, 3).map((r, i) => {
                  const w = 280 / Math.min(floorRooms(2).length, 3);
                  const x = 15 + i * (w - 5);
                  return (
                    <g key={i}>
                      <rect x={x} y={15} width={w - 10} height="70" fill={roomFill(r.name)} stroke={roomStroke(r.name)} strokeWidth="1" />
                      <text x={x + (w-10)/2} y={45} textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">{r.name.length > 10 ? r.name.slice(0, 9) + "…" : r.name}</text>
                      <text x={x + (w-10)/2} y={60} textAnchor="middle" fill="#666" fontSize="7">{r.area}m²</text>
                      <text x={x + 8} y={25} fill="#333" fontSize="8" fontWeight="bold">0{i + 6}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#2c3e50", padding: "10px 16px", borderRadius: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>TOTAL GFA</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{totalArea}m²</span>
          </div>
        </div>
      </div>

      {/* Bottom: Interior Gallery */}
      <div style={{ background: "#0d1420", padding: "20px", borderTop: "1px solid #1e293b" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 12, letterSpacing: 1 }}>INTERIOR SPACES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {interiorRooms.length > 0 ? interiorRooms.map((room, i) => (
            <div key={i} style={{ background: room.color, borderRadius: 8, padding: "12px", aspectRatio: "4/3", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
              {/* Room pattern */}
              <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.3 }}>
                <pattern id={`pat${i}`} width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="20" height="20" fill="none" />
                  <line x1="0" y1="10" x2="20" y2="10" stroke="#fff" strokeWidth="0.5" />
                  <line x1="10" y1="0" x2="10" y2="20" stroke="#fff" strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill={`url(#pat${i})`} />
              </svg>
              <div style={{ fontSize: 28, zIndex: 1 }}>{room.icon}</div>
              <div style={{ zIndex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#2c3e50", textTransform: "uppercase" }}>{room.name}</div>
                <div style={{ fontSize: 9, color: "#555" }}>{rooms.find(r => r.name.toLowerCase().includes(room.name.toLowerCase()))?.area || "--"}m²</div>
              </div>
            </div>
          )) : (
            // Default rooms if no matches
            ["Living", "Dining", "Kitchen", "Bedroom"].map((name, i) => (
              <div key={i} style={{ background: ["#c9a87c", "#a08060", "#d4b896", "#b8a090"][i], borderRadius: 8, padding: "12px", aspectRatio: "4/3", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ fontSize: 28 }}>{["🛋️", "🍽️", "👨‍🍳", "🛏️"][i]}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#2c3e50", textTransform: "uppercase" }}>{name}</div>
                  <div style={{ fontSize: 9, color: "#555" }}>{rooms[i]?.area || "--"}m²</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section Cut A-A ──────────────────────────────────────────────────────────
function SectionCut({ rooms, stories }: { rooms: Room[]; stories: number }) {
  const W = 640, GND = 180, STORY_H = 56;
  const totalH = stories * STORY_H;
  const bldX = 60, bldW = 480;
  const WALL_T = 8;
  const floorRooms = rooms.filter(r => r.floor === 1);
  const totalArea = floorRooms.reduce((s, r) => s + r.area, 0) || 1;
  const SCALE = bldW / Math.max(totalArea, 1);

  // lay rooms side by side proportionally
  let curX = bldX;
  const sections = floorRooms.map(r => {
    const w = Math.max(40, r.area * SCALE * 1.1);
    const s = { room: r, x: curX, w: Math.min(w, (bldW - WALL_T) / floorRooms.length) };
    curX += s.w;
    return s;
  });

  return (
    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#00c6e0" }}>SECTION CUT — A–A</span>
        <span style={{ fontSize: 10, color: "#4a6480" }}>Longitudinal section · Scale 1:50</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${GND + 50}`} style={{ display: "block", background: "#070d18" }}>
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#1e2a3a" strokeWidth={1} />
          </pattern>
        </defs>

        {/* Ground + foundation */}
        <rect x={20} y={GND + 8} width={W - 40} height={16} fill="url(#hatch)" />
        <line x1={20} y1={GND + 8} x2={W - 20} y2={GND + 8} stroke="#1e293b" strokeWidth={2} />

        {/* Outer walls cut section (thick hatch) */}
        <rect x={bldX} y={GND + 8 - totalH} width={WALL_T} height={totalH} fill="#1e293b" stroke="#00c6e0" strokeWidth={1} />
        <rect x={bldX + bldW - WALL_T} y={GND + 8 - totalH} width={WALL_T} height={totalH} fill="#1e293b" stroke="#00c6e0" strokeWidth={1} />

        {/* Floor slabs */}
        {Array.from({ length: stories }).map((_, i) => (
          <rect key={i} x={bldX} y={GND + 8 - (i + 1) * STORY_H} width={bldW} height={5}
            fill="#1e293b" stroke="#00c6e0" strokeWidth={0.8} />
        ))}

        {/* Rooms in section */}
        {sections.map((s, i) => {
          const fill = roomFill(s.room.name);
          const stroke = roomStroke(s.room.name);
          const rH = STORY_H - 5;
          return (
            <g key={i}>
              <rect x={s.x + WALL_T} y={GND + 8 - STORY_H + 5} width={s.w - WALL_T} height={rH}
                fill={fill} stroke={stroke} strokeWidth={0.7} strokeDasharray="3,2" />
              {/* interior wall */}
              <rect x={s.x + s.w - 2} y={GND + 8 - STORY_H + 5} width={3} height={rH}
                fill="#1e293b" />
              {/* room label */}
              <text x={s.x + WALL_T + (s.w - WALL_T) / 2} y={GND + 8 - STORY_H + 5 + rH / 2 - 5}
                textAnchor="middle" dominantBaseline="central"
                fill={stroke} fontSize={Math.min(10, (s.w - WALL_T) / 7)} fontFamily="monospace" fontWeight="bold">
                {s.room.name.length > 10 ? s.room.name.slice(0, 9) + "…" : s.room.name}
              </text>
              <text x={s.x + WALL_T + (s.w - WALL_T) / 2} y={GND + 8 - STORY_H + 5 + rH / 2 + 8}
                textAnchor="middle" dominantBaseline="central"
                fill={stroke} fontSize={8} fontFamily="monospace" opacity={0.75}>
                {s.room.area}m²
              </text>
              {/* ceiling height dim */}
              <line x1={s.x + WALL_T + 4} y1={GND + 8 - STORY_H + 5}
                x2={s.x + WALL_T + 4} y2={GND + 8}
                stroke="#445566" strokeWidth={0.7} />
              <text x={s.x + WALL_T + 10} y={GND + 8 - STORY_H / 2}
                fill="#445566" fontSize={8} fontFamily="monospace">
                3.00m
              </text>
            </g>
          );
        })}

        {/* Roof structure */}
        <line x1={bldX} y1={GND + 8 - totalH} x2={bldX + bldW} y2={GND + 8 - totalH}
          stroke="#00c6e0" strokeWidth={2} />
        <line x1={bldX} y1={GND + 8 - totalH - 10} x2={bldX + bldW} y2={GND + 8 - totalH - 10}
          stroke="#1e2a3a" strokeWidth={1} strokeDasharray="4,3" />

        {/* Overall height dim left */}
        <line x1={bldX - 18} y1={GND + 8 - totalH} x2={bldX - 18} y2={GND + 8}
          stroke="#445566" strokeWidth={0.8} />
        <line x1={bldX - 14} y1={GND + 8 - totalH} x2={bldX - 22} y2={GND + 8 - totalH}
          stroke="#445566" strokeWidth={0.8} />
        <line x1={bldX - 14} y1={GND + 8} x2={bldX - 22} y2={GND + 8}
          stroke="#445566" strokeWidth={0.8} />
        <text x={bldX - 30} y={GND + 8 - totalH / 2}
          textAnchor="middle" dominantBaseline="central"
          fill="#445566" fontSize={8} fontFamily="monospace"
          transform={`rotate(-90, ${bldX - 30}, ${GND + 8 - totalH / 2})`}>
          {(stories * 3.0).toFixed(1)} m
        </text>

        {/* Section A-A label */}
        {[bldX - 5, bldX + bldW + 5].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={GND + 8 - totalH / 2} r={10} fill="#0d1929" stroke="#00c6e0" strokeWidth={1} />
            <text x={x} y={GND + 8 - totalH / 2} textAnchor="middle" dominantBaseline="central"
              fill="#00c6e0" fontSize={9} fontWeight="bold" fontFamily="monospace">A</text>
          </g>
        ))}

        <text x={bldX + bldW / 2} y={GND + 44} textAnchor="middle"
          fill="#4a6480" fontSize={9} fontFamily="monospace" letterSpacing={2}>
          SECTION A–A
        </text>
      </svg>
    </div>
  );
}

function StudioInner({ projectId, tryFree }: { projectId: string | null; tryFree?: boolean }) {

  const [prompt, setPrompt] = useState("Design a 3-bedroom residential villa in Addis Ababa with modern style, 2 stories.");
  const [buildingType, setBuildingType] = useState("Residential");
  const [stories, setStories] = useState("2");
  const [style, setStyle] = useState("Modern");
  const [plotSize, setPlotSize] = useState("400m²");
  const [mode, setMode] = useState("CERTIFIED");
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}`).then(r => r.json()).then(data => {
      if (data.project) {
        setProjectName(data.project.name);
        if (data.project.description) setPrompt(data.project.description);
        if (data.project.projectType) setBuildingType(data.project.projectType);
        if (data.project.plotSize) setPlotSize(data.project.plotSize);
      }
    });
  }, [projectId]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<AIResult | null>(null);
  const [selectedOption, setSelectedOption] = useState("A");
  const [error, setError] = useState("");
  const [tokensUsed, setTokensUsed] = useState(0);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [zoom, setZoom] = useState(1);
  const ZOOM_STEP = 0.15;
  const zoomIn = () => setZoom(z => Math.min(z + ZOOM_STEP, 2.5));
  const zoomOut = () => setZoom(z => Math.max(z - ZOOM_STEP, 0.4));
  const zoomReset = () => setZoom(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const drawingRef = useRef<HTMLDivElement>(null);
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      drawingRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    const steps = ["Parsing client brief...", "Applying ESDA building codes...", "Generating layout options A/B/C...", "Calculating room adjacency...", "Finalising structural notes..."];
    if (!isGenerating) { setLoadStep(0); return; }
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % steps.length; setLoadStep(i); }, 900);
    return () => clearInterval(t);
  }, [isGenerating]);

  const LOAD_STEPS = ["Parsing client brief...", "Applying ESDA building codes...", "Generating layout options A/B/C...", "Calculating room adjacency...", "Finalising structural notes..."];

  async function handleGenerate() {
    setIsGenerating(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, buildingType, stories, style, plotSize, projectId, tryFree }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) setApiKeyMissing(true);
        setError(data.error || "Generation failed");
        return;
      }
      setResult(data.result);
      setTokensUsed(data.tokensUsed || 0);
      setIsMock(!!data.mock);
      setSelectedOption("A");
    } catch {
      setError("Network error — check your connection");
    } finally {
      setIsGenerating(false);
    }
  }

  const activeOpt = result?.options?.find((o) => o.id === selectedOption);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar active="ai studio" tryFree={tryFree} />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setMobileMenuOpen(false)} />
          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: 260 }}>
            <Sidebar active="ai studio" tryFree={tryFree} />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}
          className="topbar flex items-center justify-between px-4 md:px-6 py-3 md:py-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", color: "var(--text-secondary)" }}
            >
              ☰
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold">AI Architect Studio</h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {tryFree ? (
                  <span style={{ color: "#22c55e" }}> Try Free CivilOS </span>
                ) : (
                  <> {projectId ? "Linked to project" : "Standalone mode"}</>
                )}
              </p>
            </div>
          </div>
          {/* Mobile Form Toggle */}
          <button
            onClick={() => setMobileFormOpen(!mobileFormOpen)}
            className="md:hidden"
            style={{ background: mobileFormOpen ? "var(--cyan)" : "var(--bg-hover)", color: mobileFormOpen ? "#000" : "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600 }}
          >
            {mobileFormOpen ? "📋 View Drawings" : "⚙️ Configure"}
          </button>
          <div style={{ background: apiKeyMissing ? "#ef444422" : "#22c55e22", border: `1px solid ${apiKeyMissing ? "#ef444444" : "#22c55e44"}`, color: apiKeyMissing ? "#ef4444" : "#22c55e", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
            {apiKeyMissing ? "⚠ No API Key" : "🟢civilOS.Ready"}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Output panel - main drawings area */}
          <div style={{ flex: 1, display: mobileFormOpen && isMobile ? "none" : "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {!result && !isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "var(--text-muted)" }}>
                {error ? (
                  <div style={{ background: "#ef444418", border: "1px solid #ef444444", color: "#ef4444", borderRadius: 12, padding: "16px 20px", maxWidth: 380, textAlign: "center", fontSize: 13 }}>
                    ⚠ {error}
                  </div>
                ) : (
                  <>
                    <div className="text-6xl">🏗️</div>
                    <div className="font-semibold text-lg" style={{ color: "var(--cyan)" }}>Your designs will appear here</div>
                    <p className="text-sm text-center max-w-sm">Configure your project parameters on the right and click Generate to create architectural concepts</p>
                  </>
                )}
              </div>
            )}

            {isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center gap-5">
                <div style={{ width: 56, height: 56, border: "3px solid var(--border)", borderTopColor: "var(--cyan)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <div className="font-semibold text-sm" style={{ color: "var(--cyan)" }}>civilOS is designing...</div>
                <div className="flex flex-col gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  {LOAD_STEPS.map((s, i) => (
                    <div key={s} style={{ color: i === loadStep ? "var(--cyan)" : i < loadStep ? "#22c55e" : "var(--text-muted)" }}>
                      {i < loadStep ? "✓" : i === loadStep ? "⟳" : "○"} {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && activeOpt && (
              <div ref={drawingRef} style={{ flex: 1, overflowY: "auto", overflowX: "clip", background: "#070d18", display: "flex", flexDirection: "column" }}>

                {/* ── Drawing Board Header ── */}
                <div style={{ background: "#0a0f1a", borderBottom: "1px solid #1e293b", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {result.options?.map((o) => (
                      <button key={o.id} onClick={() => setSelectedOption(o.id)}
                        style={{ background: selectedOption === o.id ? "var(--cyan)" : "#0d1929", color: selectedOption === o.id ? "#000" : "#4a6480", border: `1px solid ${selectedOption === o.id ? "var(--cyan)" : "#1e293b"}`, borderRadius: 7, padding: "5px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {o.label} <span style={{ fontSize: 10, opacity: 0.75 }}>· {o.styleTag}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {isMock && <span style={{ color: "#f59e0b", fontSize: 11, background: "#f59e0b18", border: "1px solid #f59e0b44", borderRadius: 6, padding: "3px 10px" }}>⚡ Demo Mode</span>}
                    <span style={{ color: "#22c55e", fontSize: 11 }}>● {activeOpt.estimatedArea}m² total</span>
                    <span style={{ color: "#4a6480", fontSize: 11 }}>Scale 1:50 · metres</span>
                    <button
                      onClick={toggleFullscreen}
                      title={isFullscreen ? "Exit fullscreen (Esc)" : "Open fullscreen"}
                      style={{ background: isFullscreen ? "rgba(0,198,224,0.15)" : "var(--bg-hover)", border: `1px solid ${isFullscreen ? "var(--cyan)" : "var(--border)"}`, color: isFullscreen ? "var(--cyan)" : "var(--text-muted)", borderRadius: 7, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--cyan)"; e.currentTarget.style.color = "var(--cyan)"; }}
                      onMouseLeave={e => { if (!isFullscreen) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; } }}>
                      {isFullscreen ? (
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M5 1H1v4M10 1h4v4M5 14H1v-4M10 14h4v-4"/>
                          <path d="M1 1l4 4M14 1l-4 4M1 14l4-4M14 14l-4-4"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M1 5V1h4M10 1h4v4M14 10v4h-4M5 14H1v-4"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Zoom controls + title block row ── */}
                <div style={{ background: "#0a0f1a", borderBottom: "1px solid #1e293b", padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {/* Zoom bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#070d18", border: "1px solid #1e293b", borderRadius: 8, padding: "3px 6px" }}>
                    <button onClick={zoomOut} title="Zoom out"
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 6px", borderRadius: 5 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--cyan)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>−</button>
                    <span style={{ fontSize: 11, color: "var(--cyan)", fontFamily: "monospace", minWidth: 38, textAlign: "center", fontWeight: 700 }}>{Math.round(zoom * 100)}%</span>
                    <button onClick={zoomIn} title="Zoom in"
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 6px", borderRadius: 5 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--cyan)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>+</button>
                    <div style={{ width: 1, height: 14, background: "var(--border)", margin: "0 2px" }} />
                    <button onClick={zoomReset} title="Reset zoom"
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 10, fontFamily: "monospace", padding: "2px 6px", borderRadius: 5 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--cyan)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>FIT</button>
                  </div>
                  <div style={{ width: 1, height: 22, background: "var(--border)" }} />
                  {/* Title block */}
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", flex: 1 }}>
                    {[
                      ["PROJECT", activeOpt.label + " — " + activeOpt.styleTag],
                      ["DRAWN BY", "CivilOS AI "],
                      ["DATE", new Date().toLocaleDateString("en-GB")],
                      ["DRAWING NO.", "A-" + activeOpt.id + "-001"],
                      ["SCALE", "1:50"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 9, color: "#4a6480", letterSpacing: 1 }}>{k}</div>
                        <div style={{ fontSize: 11, color: "#a0b4c8", fontFamily: "monospace", marginTop: 1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Print/export hint */}
                  <button onClick={() => window.print()} title="Print drawings"
                    style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 7, padding: "4px 12px", fontSize: 11, cursor: "pointer", flexShrink: 0, fontFamily: "monospace" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--cyan)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                    ⎙ Print
                  </button>
                </div>

                {/* ── Scrollable zoom canvas ── */}
                <div style={{ overflowX: "auto", overflowY: "visible", flex: 1, minHeight: 0 }}>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24, minWidth: zoom > 1 ? `${zoom * 100}%` : "100%" }}>

                  {/* ── AI Summary strip ── */}
                  <div style={{ background: "rgba(0,198,224,0.07)", border: "1px solid rgba(0,198,224,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#00c6e0", letterSpacing: 1, marginBottom: 4 }}>DESIGN BRIEF</div>
                      <p style={{ fontSize: 12, color: "#8099b3", lineHeight: 1.7, margin: 0 }}>{result.projectSummary}</p>
                    </div>
                    {result.aiRecommendation && (
                      <div style={{ minWidth: 180, flex: "1 1 180px", background: "#22c55e10", border: "1px solid #22c55e33", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: 1, marginBottom: 4 }}>AI RECOMMENDATION</div>
                        <p style={{ fontSize: 11, color: "#86efac", lineHeight: 1.6, margin: 0 }}>{result.aiRecommendation}</p>
                      </div>
                    )}
                  </div>

                  {/* ── Floor Plans (one per floor) ── */}
                  {Array.from(new Set(activeOpt.rooms.map(r => r.floor))).sort().map(fl => (
                    <ArchFloorPlan key={fl} rooms={activeOpt.rooms} floor={fl}
                      label={fl === 1 ? "Ground Floor" : fl === 2 ? "First Floor" : fl === 3 ? "Second Floor" : `Floor ${fl}`} />
                  ))}

                  {/* ── Front Elevation ── */}
                  <FrontElevation rooms={activeOpt.rooms} stories={parseInt(stories) || 2} styleTag={activeOpt.styleTag} />

                  {/* ── Section Cut A-A ── */}
                  <SectionCut rooms={activeOpt.rooms} stories={parseInt(stories) || 2} />

                  {/* ── Side Elevations (Left + Right) ── */}
                  <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <SideElevation rooms={activeOpt.rooms} stories={parseInt(stories) || 2} styleTag={activeOpt.styleTag} side="LEFT" />
                    <SideElevation rooms={activeOpt.rooms} stories={parseInt(stories) || 2} styleTag={activeOpt.styleTag} side="RIGHT" />
                  </div>

                  {/* ── Back / Rear Elevation ── */}
                  <BackElevation rooms={activeOpt.rooms} stories={parseInt(stories) || 2} styleTag={activeOpt.styleTag} />

                  {/* ── 3D Isometric View ── */}
                  <Iso3DView rooms={activeOpt.rooms} stories={parseInt(stories) || 2} styleTag={activeOpt.styleTag} />

                  {/* ── Real Construction - Finished House Visual ── */}
                  <RealConstructionView rooms={activeOpt.rooms} stories={parseInt(stories) || 2} styleTag={activeOpt.styleTag} />

                  {/* ── Final Presentation ── */}
                  <FinalPresentation rooms={activeOpt.rooms} stories={parseInt(stories) || 2} styleTag={activeOpt.styleTag} option={activeOpt} />

                  {/* ── Bottom info row: features + room schedule + cost ── */}
                  <div className="grid-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

                    {/* Features */}
                    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#00c6e0", marginBottom: 12 }}>KEY FEATURES</div>
                      {activeOpt.keyFeatures?.map((f) => (
                        <div key={f} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#8099b3" }}>
                          <span style={{ color: "#00c6e0", flexShrink: 0 }}>›</span>{f}
                        </div>
                      ))}
                      {activeOpt.structuralNotes && (
                        <div style={{ marginTop: 12, padding: "8px 10px", background: "#1a5cff14", border: "1px solid #1a5cff33", borderRadius: 8, fontSize: 11, color: "#7aa5ff" }}>
                          🏗 {activeOpt.structuralNotes}
                        </div>
                      )}
                      {result.structuralWarnings?.length > 0 && (
                        <div style={{ marginTop: 10, padding: "8px 10px", background: "#f59e0b14", border: "1px solid #f59e0b33", borderRadius: 8, fontSize: 11, color: "#fcd34d" }}>
                          ⚠ {result.structuralWarnings[0]}
                        </div>
                      )}
                    </div>

                    {/* Room schedule */}
                    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#00c6e0", marginBottom: 12 }}>ROOM SCHEDULE</div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #1e293b" }}>
                            {["#", "Room", "Fl.", "Area"].map(h => <th key={h} style={{ fontSize: 9, color: "#4a6480", textAlign: "left", paddingBottom: 6, fontFamily: "monospace" }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {activeOpt.rooms?.map((r, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #0d1929" }}>
                              <td style={{ fontSize: 10, color: "#4a6480", padding: "5px 0", fontFamily: "monospace" }}>{String(i+1).padStart(2,"0")}</td>
                              <td style={{ fontSize: 11, color: "#8099b3", padding: "5px 6px" }}>{r.name}</td>
                              <td style={{ fontSize: 10, color: "#4a6480", padding: "5px 4px", fontFamily: "monospace" }}>F{r.floor}</td>
                              <td style={{ fontSize: 11, fontWeight: 700, color: "#00c6e0", padding: "5px 0", fontFamily: "monospace" }}>{r.area}m²</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: "1px solid #1e293b" }}>
                            <td colSpan={3} style={{ fontSize: 11, fontWeight: 700, color: "#8099b3", paddingTop: 8, fontFamily: "monospace" }}>TOTAL GFA</td>
                            <td style={{ fontSize: 13, fontWeight: 700, color: "#00c6e0", paddingTop: 8, fontFamily: "monospace" }}>{activeOpt.estimatedArea}m²</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Cost + action */}
                    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#00c6e0", marginBottom: 12 }}>COST ESTIMATE</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e", fontFamily: "monospace" }}>
                          ${(activeOpt.costRange?.min / 1000).toFixed(0)}K – ${(activeOpt.costRange?.max / 1000).toFixed(0)}K
                        </div>
                        <div style={{ fontSize: 11, color: "#4a6480", marginTop: 4, fontFamily: "monospace" }}>{activeOpt.costRange?.currency} · {activeOpt.estimatedArea}m² GFA</div>
                        <div style={{ fontSize: 11, color: "#4a6480", marginTop: 2, fontFamily: "monospace" }}>
                          ≈ ${Math.round(((activeOpt.costRange?.min + activeOpt.costRange?.max) / 2) / activeOpt.estimatedArea).toLocaleString()}/m² avg
                        </div>
                      </div>
                      <div style={{ height: 1, background: "#1e293b" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[1,2,3].map(fl => {
                          const flRooms = activeOpt.rooms.filter(r => r.floor === fl);
                          if (!flRooms.length) return null;
                          const flArea = flRooms.reduce((s,r) => s + r.area, 0);
                          return (
                            <div key={fl} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8099b3", fontFamily: "monospace" }}>
                              <span>Floor {fl} ({flRooms.length} rooms)</span>
                              <span style={{ color: "#00c6e0" }}>{flArea}m²</span>
                            </div>
                          );
                        })}
                      </div>
                      {projectId ? (
                        <button style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: "auto" }}
                          onClick={() => window.location.href = `/workspace/${projectId}`}>
                          ✓ Send to Architect Review →
                        </button>
                      ) : (
                        <div style={{ fontSize: 11, color: "#4a6480", textAlign: "center", padding: "10px 0", marginTop: "auto", fontFamily: "monospace" }}>
                          Open from workspace to link design
                        </div>
                      )}
                    </div>
                  </div>

                </div>
                </div>
              </div>
            )}
          </div>

          {/* Right form panel - Desktop */}
          <div style={{ width: rightCollapsed ? 44 : 320, minWidth: rightCollapsed ? 44 : 320, background: "var(--bg-panel)", borderLeft: "1px solid var(--border)", overflowY: "auto", transition: "width 0.2s ease" }}
            className="hidden md:flex flex-col relative">
            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={() => setRightCollapsed(!rightCollapsed)}
              title={rightCollapsed ? "Expand panel" : "Collapse panel"}
              style={{
                position: "absolute",
                left: -4,
                top: 16,
                width: 28,
                height: 28,
                background: "var(--bg-card)",
                border: "2px solid var(--cyan)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
                color: "var(--text-muted)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--cyan)"; e.currentTarget.style.color = "var(--cyan)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--cyan)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
              {rightCollapsed ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              )}
            </button>
            {/* Desktop Form Content */}
            <div style={{ display: rightCollapsed ? "none" : "flex", flexDirection: "column", gap: 16, padding: "16px 20px" }}>
              {/* AI Architect Engine Header */}
            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div className="text-2xl">🤖</div>
                <div className="font-bold text-base" style={{ color: "var(--cyan)" }}>AI Architect Engine</div>
              </div>
             
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Workflow Mode</div>
              {[{ id: "CERTIFIED", label: "Certified", desc: "Human review at every stage", icon: "🛡️" }, { id: "AI_DRAFT", label: "AI Full Draft", desc: "Fully automated, fast concept", icon: "⚡" }].map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  style={{ width: "100%", background: mode === m.id ? "rgba(0,198,224,0.1)" : "var(--bg-card)", border: mode === m.id ? "1px solid var(--cyan)" : "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", textAlign: "left", cursor: "pointer", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: mode === m.id ? "var(--cyan)" : "var(--text-primary)" }}>{m.icon} {m.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {projectId ? (
              <div style={{ background: "rgba(0,198,224,0.06)", border: "1px solid rgba(0,198,224,0.3)", borderRadius: 10, padding: "12px", marginBottom: 4 }}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--cyan)" }}>🔗 Linked Project</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{projectName || "Loading..."}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>The AI will use the project's description and details to generate the draft.</div>
              </div>
            ) : (
              <>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Project Brief</div>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4}
                    style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", resize: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    { label: "Building Type", value: buildingType, setter: setBuildingType, options: ["Residential", "Commercial", "Public", "Industrial"] },
                    { label: "Stories", value: stories, setter: setStories, options: ["1", "2", "3", "4"] },
                    { label: "Style", value: style, setter: setStyle, options: ["Modern", "Traditional", "Mixed", "Contemporary"] },
                    { label: "Plot Size", value: plotSize, setter: setPlotSize, options: ["200m²", "400m²", "600m²", "800m²+"] },
                  ].map((p) => (
                    <div key={p.label}>
                      <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{p.label}</label>
                      <select value={p.value} onChange={(e) => p.setter(e.target.value)}
                        style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none" }}>
                        {p.options.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </>
            )}

            {apiKeyMissing && (
              <div style={{ background: "#f59e0b18", border: "1px solid #f59e0b44", color: "#f59e0b", borderRadius: 9, padding: "10px 12px", fontSize: 11, lineHeight: 1.6 }}>
                ⚠ Add <code>OPENAI_API_KEY=sk-...</code> to your <code>.env.local</code> to enable AI generation.
              </div>
            )}

            <button onClick={handleGenerate} disabled={isGenerating}
              style={{ background: isGenerating ? "var(--cyan-dim)" : "var(--cyan)", color: "#000", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 14, cursor: isGenerating ? "not-allowed" : "pointer" }}>
              {isGenerating ? "⏳ Generating..." : "🚀 Generate with civilOS"}
            </button>

            {tokensUsed > 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>Used {tokensUsed} tokens</div>}
            </div>
          </div>
          {/* Mobile Form Panel */}
          {mobileFormOpen && isMobile && (
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "70vh", background: "var(--bg-panel)", borderTop: "1px solid var(--border)", zIndex: 300, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                <span className="font-bold" style={{ color: "var(--cyan)" }}>⚙️ Configuration</span>
                <button onClick={() => setMobileFormOpen(false)} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", fontSize: 12 }}>Close</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* AI Architect Engine Header */}
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div className="text-2xl">🤖</div>
                    <div className="font-bold text-base" style={{ color: "var(--cyan)" }}>AI Architect Engine</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Workflow Mode</div>
                  {[{ id: "CERTIFIED", label: "Certified", desc: "Human review at every stage", icon: "🛡️" }, { id: "AI_DRAFT", label: "AI Full Draft", desc: "Fully automated, fast concept", icon: "⚡" }].map((m) => (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      style={{ width: "100%", background: mode === m.id ? "rgba(0,198,224,0.1)" : "var(--bg-card)", border: mode === m.id ? "1px solid var(--cyan)" : "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", textAlign: "left", cursor: "pointer", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: mode === m.id ? "var(--cyan)" : "var(--text-primary)" }}>{m.icon} {m.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
                {projectId ? (
                  <div style={{ background: "rgba(0,198,224,0.06)", border: "1px solid rgba(0,198,224,0.3)", borderRadius: 10, padding: "12px", marginBottom: 4 }}>
                    <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--cyan)" }}>🔗 Linked Project</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{projectName || "Loading..."}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>The AI will use the project's description and details to generate the draft.</div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Project Brief</div>
                      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4}
                        style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", resize: "none" }}
                        onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: "Building Type", value: buildingType, setter: setBuildingType, options: ["Residential", "Commercial", "Public", "Industrial"] },
                        { label: "Stories", value: stories, setter: setStories, options: ["1", "2", "3", "4"] },
                        { label: "Style", value: style, setter: setStyle, options: ["Modern", "Traditional", "Mixed", "Contemporary"] },
                        { label: "Plot Size", value: plotSize, setter: setPlotSize, options: ["200m²", "400m²", "600m²", "800m²+"] },
                      ].map((p) => (
                        <div key={p.label}>
                          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{p.label}</label>
                          <select value={p.value} onChange={(e) => p.setter(e.target.value)}
                            style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none" }}>
                            {p.options.map((o) => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {apiKeyMissing && (
                  <div style={{ background: "#f59e0b18", border: "1px solid #f59e0b44", color: "#f59e0b", borderRadius: 9, padding: "10px 12px", fontSize: 11, lineHeight: 1.6 }}>
                    ⚠ Add <code>GEMINI_API_KEY=...</code> to your <code>.env</code> to enable AI generation.
                  </div>
                )}
                <button onClick={handleGenerate} disabled={isGenerating}
                  style={{ background: isGenerating ? "var(--cyan-dim)" : "var(--cyan)", color: "#000", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 14, cursor: isGenerating ? "not-allowed" : "pointer" }}>
                  {isGenerating ? "⏳ Generating..." : "🚀 Generate with civilOS"}
                </button>
                {tokensUsed > 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>Used {tokensUsed} tokens</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SearchParamsReader({ onRead }: { onRead: (params: { projectId: string | null; tryFree: boolean }) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onRead({
      projectId: searchParams.get("projectId"),
      tryFree: searchParams.has("tryFree"),
    });
  }, [searchParams, onRead]);
  return null;
}

export default function StudioPage() {
  const [params, setParams] = useState<{ projectId: string | null; tryFree: boolean }>({ projectId: null, tryFree: false });
  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsReader onRead={setParams} />
      </Suspense>
      <StudioInner projectId={params.projectId} tryFree={params.tryFree} />
    </>
  );
}
