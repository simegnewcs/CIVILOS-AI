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

function AiDrawing({ title, subtitle, prompt, seed }: { title: string; subtitle: string; prompt: string; seed: number }) {
  const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&nologo=true&seed=${seed}`;
  return (
    <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#00c6e0" }}>{title}</span>
        <span style={{ fontSize: 10, color: "#4a6480" }}>{subtitle}</span>
      </div>
      <div style={{ position: "relative", width: "100%", height: 500, background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
  );
}

function ArchFloorPlan({ rooms, floor, label }: { rooms: Room[]; floor: number; label: string }) {
  if (!rooms.filter(r => r.floor === floor).length) return null;
  return <AiDrawing title={`FLOOR PLAN — ${label.toUpperCase()}`} subtitle="AI Generated Blueprint" prompt={`architectural 2d floor plan blueprint for floor ${floor}, highly detailed architectural drawing, clean white background, cad style`} seed={rooms.length * floor} />
}

// ── Front Elevation ──────────────────────────────────────────────────────────
function FrontElevation({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  return <AiDrawing title="FRONT ELEVATION — VIEW A" subtitle="Photorealistic Architectural Drawing" prompt={`Architectural front elevation technical drawing of a ${stories} story ${styleTag} style house, clean white background, architectural blueprint style, high detail`} seed={rooms.length + stories} />
}

// ── Side Elevation (left or right) ──────────────────────────────────────────
function SideElevation({ rooms, stories, styleTag, side }: { rooms: Room[]; stories: number; styleTag: string; side: "LEFT" | "RIGHT" }) {
  return <AiDrawing title={`SIDE ELEVATION — ${side}`} subtitle="Photorealistic Architectural Drawing" prompt={`Architectural side elevation technical drawing of a ${stories} story ${styleTag} style house, clean white background, architectural blueprint style, high detail`} seed={rooms.length * (side === 'LEFT' ? 1 : 2)} />
}

// ── Back Elevation ────────────────────────────────────────────────────────────
function BackElevation({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  return <AiDrawing title="BACK ELEVATION — VIEW C" subtitle="Photorealistic Architectural Drawing" prompt={`Architectural back rear elevation technical drawing of a ${stories} story ${styleTag} style house, clean white background, architectural blueprint style, high detail`} seed={rooms.length + 5} />
}


// ── Isometric 3D View ─────────────────────────────────────────────────────────
function Iso3DView({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  return <AiDrawing title={`${styleTag?.toUpperCase() || "RESIDENTIAL"} DESIGN`} subtitle={`${stories} FLOOR${stories > 1 ? "S" : ""} · ISOMETRIC 3D VIEW`} prompt={`3D isometric architectural render of a ${stories} story ${styleTag} style house, white background, high quality architectural visualization, beautiful lighting`} seed={rooms.length + 10} />
}

// ── Real Construction - Finished House Visual ────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RealConstructionView({ rooms, stories, styleTag }: { rooms: Room[]; stories: number; styleTag: string }) {
  return (
    <div style={{ background: "#0a0f1a", border: "2px solid #00c6e044", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0f1a" }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#22c55e" }}>🏡 REAL CONSTRUCTION — FINISHED HOUSE</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, color: "#4a6480" }}>Photorealistic Render</span>
        </div>
      </div>
      
      <div style={{ position: "relative", width: "100%", height: 520, background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80" 
          alt="Real Construction"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "6px 12px", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }}>
          CivilOS AI Vision
        </div>
      </div>
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
  return <AiDrawing title="SECTION CUT — A-A" subtitle="Longitudinal section · AI Generated" prompt={`Architectural section cut drawing of a ${stories} story house, showing internal rooms, highly detailed cad style drawing, white background`} seed={rooms.length + 15} />
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
