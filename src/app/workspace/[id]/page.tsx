"use client";
import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// ─── Types matching Prisma schema exactly ─────────────────────────────────────
interface StageComment { id: string; body: string; user: { name: string; role: string }; createdAt: string; }
interface Stage {
  id: string; stageType: string; status: string; stageOrder: number;
  aiOutput?: string | null; humanNotes?: string | null;
  comments: StageComment[];
  assignee?: { name: string; role: string } | null;
}
interface CostEst { totalMin?: number | null; totalMax?: number | null; labour?: number | null; foundation?: number | null; structure?: number | null; mep?: number | null; currency?: string; }
interface Project {
  id: string; name: string; clientName: string; projectType: string; status: string;
  progress: number; location?: string | null; description?: string | null; plotSize?: string | null;
  stages: Stage[];
  costEstimate?: CostEst | null;
}

const STAGE_LABEL: Record<string, string> = {
  CLIENT_BRIEF: "Client Brief", AI_GENERATION: "AI Generation", PROMPTER_REVIEW: "Prompter Review",
  ARCHITECT_REVIEW: "Architect Review", STRUCTURAL_REVIEW: "Engineer Review", QS_REVIEW: "QS Review",
  PM_APPROVAL: "PM Approval", FINAL_DELIVERY: "Delivered",
};
const STAGE_ICON: Record<string, string> = {
  CLIENT_BRIEF: "👤", AI_GENERATION: "🤖", PROMPTER_REVIEW: "👀", ARCHITECT_REVIEW: "✏️",
  STRUCTURAL_REVIEW: "🔩", QS_REVIEW: "📊", PM_APPROVAL: "✅", FINAL_DELIVERY: "🎉",
};
const STATUS_COLOR: Record<string, string> = {
  IN_PROGRESS: "#f59e0b", AWAITING_REVIEW: "#00c6e0", COMPLETED: "#22c55e",
  DRAFT: "#4a6480", CANCELLED: "#ef4444",
};

// Who is responsible for each stage
const STAGE_ROLE: Record<string, string> = {
  CLIENT_BRIEF: "Client / Prompter",
  AI_GENERATION: "AI Engine",
  PROMPTER_REVIEW: "Client / Prompter",
  ARCHITECT_REVIEW: "Human Architect",
  STRUCTURAL_REVIEW: "Structural Engineer",
  QS_REVIEW: "Quantity Surveyor",
  PM_APPROVAL: "Project Manager",
  FINAL_DELIVERY: "Project Manager",
};

// What action is expected at each stage
const STAGE_ACTION: Record<string, string> = {
  CLIENT_BRIEF: "Client / Prompter writes the complete brief into the system based on client's idea.",
  AI_GENERATION: "AI Architect, Structural & Cost agents generate initial project output.",
  PROMPTER_REVIEW: "Prompter reviews and edits before sending to Architect.",
  ARCHITECT_REVIEW: "Human Architect reviews AI generated design, reorganizes layouts, and approves architectural stage.",
  STRUCTURAL_REVIEW: "Human Structural Engineer reviews AI analysis, verifies safety, and gives structural approval.",
  QS_REVIEW: "Quantity Surveyor (QS) reviews BOQ, materials, costs, and approves the budget.",
  PM_APPROVAL: "Project Manager reviews the entire project history, risks, and gives final approval.",
  FINAL_DELIVERY: "Final project delivery documents are made available to the client.",
};

function stageUiStatus(s: Stage) {
  if (s.status === "APPROVED") return "done";
  if (["AWAITING_HUMAN", "AI_RUNNING", "IN_REVIEW"].includes(s.status)) return "active";
  return "pending";
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Floor plan rendered from AI room data ────────────────────────────────────
interface Room { name: string; area: number; floor: number; }
const ROOM_COLOR: Record<string, string> = {
  "Living": "#00c6e025", "Kitchen": "#a855f725", "Dining": "#f59e0b25",
  "Master": "#1a5cff30", "Bedroom": "#1a5cff22", "Bathroom": "#22c55e25",
  "Corridor": "#4a648030", "Store": "#78716c25", "Garage": "#57534e25", "Courtyard": "#00c6e015",
};
function roomColor(name: string) {
  const key = Object.keys(ROOM_COLOR).find((k) => name.includes(k));
  return key ? ROOM_COLOR[key] : "#ffffff10";
}

function FloorPlanSVG({ rooms }: { rooms: Room[] }) {
  const floor1 = rooms.filter((r) => r.floor === 1);
  const total = floor1.reduce((s, r) => s + r.area, 0) || 1;
  const W = 440, H = 300, PAD = 20;
  let cursor = PAD;
  return (
    <svg width={W + PAD * 2} height={H + PAD * 2} style={{ maxWidth: "100%", maxHeight: "100%" }}>
      <rect x={PAD} y={PAD} width={W} height={H} fill="none" stroke="#00c6e0" strokeWidth="2" rx="3" />
      {floor1.map((r) => {
        const rw = Math.round((r.area / total) * W);
        const rx = cursor;
        cursor += rw;
        const color = roomColor(r.name);
        return (
          <g key={r.name}>
            <rect x={rx} y={PAD} width={rw} height={H} fill={color} stroke="#00c6e044" strokeWidth="1" />
            <text x={rx + rw / 2} y={PAD + H / 2 - 7} textAnchor="middle" fill="#7a99b8" fontSize="9" fontFamily="sans-serif">{r.name}</text>
            <text x={rx + rw / 2} y={PAD + H / 2 + 7} textAnchor="middle" fill="#00c6e0" fontSize="9" fontWeight="bold" fontFamily="sans-serif">{r.area}m²</text>
          </g>
        );
      })}
      <path d={`M ${PAD + W * 0.28} ${PAD} Q ${PAD + W * 0.28} ${PAD + 18} ${PAD + W * 0.28 + 14} ${PAD + 18}`} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2" />
    </svg>
  );
}
const STAGE_AUTH_ROLE: Record<string, string[]> = {
  CLIENT_BRIEF: ["CLIENT", "ADMIN", "PROMPTER"],
  AI_GENERATION: [],
  PROMPTER_REVIEW: ["CLIENT", "ADMIN", "PROMPTER"],
  ARCHITECT_REVIEW: ["ARCHITECT", "ADMIN"],
  STRUCTURAL_REVIEW: ["STRUCTURAL_ENGINEER", "ADMIN"],
  QS_REVIEW: ["QUANTITY_SURVEYOR", "ADMIN"],
  PM_APPROVAL: ["PROJECT_MANAGER", "ADMIN"],
  FINAL_DELIVERY: ["CLIENT", "ADMIN", "PROMPTER"],
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [me, setMe] = useState<{ id: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStageId, setActiveStageId] = useState<string>("");
  const [view, setView] = useState<"stage" | "floor" | "info">("stage");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [selectedOption, setSelectedOption] = useState("A");
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => { if (d?.user) setMe(d.user); });
  }, []);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      // "demo" is not a real DB id — resolve to the user's first real project
      if (id === "demo") {
        const listRes = await fetch("/api/projects");
        if (listRes.status === 401) { router.push("/login"); return; }
        const listData = await listRes.json();
        const first = listData.projects?.[0];
        if (first) { router.replace(`/workspace/${first.id}`); return; }
        // No projects yet — stay on this page and show empty state
        setProject(null);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/projects/${id}`);
      if (res.status === 401) { router.push("/login"); return; }
      if (res.status === 404) { router.push("/dashboard"); return; }
      const data = await res.json();
      setProject(data.project);
      // Remember this project so sidebar links directly next time (no /demo roundtrip)
      if (typeof window !== "undefined") {
        localStorage.setItem("lastWorkspaceId", id);
      }
    } finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  useEffect(() => {
    if (!project) return;
    const active = project.stages.find((s) => stageUiStatus(s) === "active");
    if (active) setActiveStageId(active.id);
    else if (project.stages.length > 0) setActiveStageId(project.stages[0].id);
  }, [project]);

  const activeStage = project?.stages.find((s) => s.id === activeStageId);

  // Parse AI output for floor plan
  let aiRooms: Room[] = [];
  let aiOptions: { id: string; label: string; styleTag: string }[] = [];
  let floorPlanImage = "";
  const aiStage = project?.stages.find((s) => s.stageType === "AI_GENERATION" && s.aiOutput);
  if (aiStage?.aiOutput) {
    try {
      const parsed = JSON.parse(aiStage.aiOutput);
      floorPlanImage = parsed.floorPlanImage || "";
      const opts = parsed.options || [];
      aiOptions = opts.map((o: { id: string; label: string; styleTag: string }) => ({ id: o.id, label: o.label, styleTag: o.styleTag }));
      const chosen = opts.find((o: { id: string }) => o.id === selectedOption) || opts[0];
      if (chosen?.rooms) aiRooms = chosen.rooms;
    } catch { /* no AI output yet */ }
  }

  async function handleApprove(decision: "approved" | "rejected" | "sent_back") {
    if (!activeStage) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: activeStage.id,
          decision,
          signature: "digital",
          notes: comment || undefined,
        }),
      });
      if (res.ok) {
        setComment("");
        await fetchProject();
        setActionMsg(`Stage ${decision === "approved" ? "approved ✓" : decision === "rejected" ? "rejected" : "sent back to AI"}`);
        setTimeout(() => setActionMsg(""), 3000);
      }
    } finally { setSubmitting(false); }
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/projects/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment, stageId: activeStage?.id }),
      });
      setComment("");
      await fetchProject();
    } finally { setSubmitting(false); }
  }

  async function generateFloorPlanImage() {
    if (!project) return;
    setGeneratingImage(true);
    try {
      const res = await fetch("/api/ai/generate-floorplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (res.ok) {
        await fetchProject();
      } else {
        const err = await res.json();
        alert("Failed to generate image: " + err.error);
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setGeneratingImage(false);
    }
  }

  // Flatten all comments from all stages, sorted newest first
  const allComments = project?.stages
    .flatMap((s) => s.comments)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) ?? [];

  const cost = project?.costEstimate;
  const statusColor = STATUS_COLOR[project?.status || ""] || "#4a6480";
  const statusLabel = (project?.status || "").replace(/_/g, " ");

  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}>
      <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--cyan)", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 14 }} />
      Loading workspace...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!project) return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar active="workspace" />
      <div className="flex-1 flex flex-col items-center justify-center gap-5" style={{ color: "var(--text-muted)" }}>
        <div style={{ fontSize: 56 }}>🏗️</div>
        <div className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>No projects yet</div>
        <p className="text-sm text-center max-w-xs" style={{ lineHeight: 1.7 }}>
          Create your first project from the Dashboard, then open it here to manage its workflow.
        </p>
        <Link href="/dashboard"
          style={{ background: "var(--cyan)", color: "#000", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          ← Go to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar active="workspace" />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}
          className="topbar flex items-center justify-between px-5 py-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: 13 }} className="hover:text-white transition-colors">← Dashboard</Link>
            <span style={{ color: "var(--border)" }}>/</span>
            <span className="font-semibold text-sm">{project.name}</span>
            <span style={{ background: statusColor + "22", color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{statusLabel}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· {project.clientName} · {project.projectType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/studio?projectId=${project.id}`}
              style={{ background: "var(--cyan)", color: "#000", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              🤖 AI Studio
            </Link>
          </div>
        </div>

        {/* 3-panel body */}
        <div className="panel-row flex flex-1 overflow-hidden">

          {/* LEFT — Workflow Steps */}
          <div style={{ width: 230, minWidth: 230, background: "var(--bg-panel)", borderRight: "1px solid var(--border)", overflowY: "auto" }}>
            <div className="p-4">
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>Overall Progress</span><span style={{ color: "var(--cyan)", fontWeight: 700 }}>{project.progress}%</span>
                </div>
                <div style={{ background: "var(--bg-hover)", borderRadius: 4, height: 5 }}>
                  <div style={{ background: "var(--cyan)", width: `${project.progress}%`, height: "100%", borderRadius: 4 }} />
                </div>
              </div>

              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Workflow Stages</div>
              <div className="flex flex-col gap-1.5">
                {project.stages.map((stage, i) => {
                  const ui = stageUiStatus(stage);
                  const isActive = stage.id === activeStageId;
                  return (
                    <button key={stage.id} onClick={() => setActiveStageId(stage.id)}
                      style={{
                        background: isActive ? "rgba(0,198,224,0.12)" : "transparent",
                        border: isActive ? "1px solid rgba(0,198,224,0.3)" : "1px solid transparent",
                        borderRadius: 10, padding: "9px 11px", textAlign: "left", cursor: "pointer", width: "100%",
                      }}>
                      <div className="flex items-center gap-2">
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", fontSize: 9, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          background: ui === "done" ? "#22c55e" : ui === "active" ? "var(--cyan)" : "var(--bg-hover)",
                          color: ui === "done" || ui === "active" ? "#000" : "var(--text-muted)",
                          border: ui === "pending" ? "1px solid var(--border)" : "none",
                        }}>
                          {ui === "done" ? "✓" : STAGE_ICON[stage.stageType] || (i + 1)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: isActive ? "var(--cyan)" : ui === "done" ? "var(--text-secondary)" : ui === "active" ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {STAGE_LABEL[stage.stageType] || stage.stageType}
                          </div>
                          <div style={{ fontSize: 10, color: ui === "done" ? "#22c55e" : ui === "active" ? "var(--cyan)" : "var(--text-muted)", marginTop: 1 }}>
                            {ui === "done" ? "✓ Done" : ui === "active" ? "● Active" : "Pending"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER — Stage Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Tab bar */}
            <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}
              className="flex items-center gap-1 px-4 py-2 shrink-0">
              {(["stage", "floor", "info"] as const).map((v) => (
                <button key={v} onClick={() => setView(v as "floor" | "info" | "stage")}
                  style={{ background: view === v ? "var(--cyan)" : "var(--bg-hover)", color: view === v ? "#000" : "var(--text-secondary)", border: "none", borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {v === "stage" ? "Stage Detail" : v === "floor" ? "3D Render" : "Project Info"}
                </button>
              ))}
              {aiOptions.length > 0 && view === "floor" && (
                <div className="flex gap-1 ml-2">
                  {aiOptions.map((o) => (
                    <button key={o.id} onClick={() => setSelectedOption(o.id)}
                      style={{ background: selectedOption === o.id ? "rgba(0,198,224,0.15)" : "var(--bg-card)", border: selectedOption === o.id ? "1px solid var(--cyan)" : "1px solid var(--border)", color: selectedOption === o.id ? "var(--cyan)" : "var(--text-muted)", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>

              {/* ── STAGE DETAIL ── */}
              {view === "stage" && activeStage && (() => {
                const ui = stageUiStatus(activeStage);
                const nextStage = project.stages.find((s) => s.stageOrder === activeStage.stageOrder + 1);
                const isAiStage = activeStage.stageType.startsWith("AI_");
                let aiParsed: { aiRecommendation?: string; structuralWarnings?: string[]; projectSummary?: string } | null = null;
                if (activeStage.aiOutput) { try { aiParsed = JSON.parse(activeStage.aiOutput); } catch { /* */ } }

                return (
                  <div className="p-5 flex flex-col gap-4 max-w-2xl">

                    {/* Stage header */}
                    <div style={{ background: "var(--bg-card)", border: `1px solid ${ui === "done" ? "#22c55e44" : ui === "active" ? "rgba(0,198,224,0.35)" : "var(--border)"}`, borderRadius: 14, padding: 20 }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: 20 }}>{STAGE_ICON[activeStage.stageType]}</span>
                            <span className="font-bold text-base">{STAGE_LABEL[activeStage.stageType]}</span>
                            <span style={{
                              background: ui === "done" ? "#22c55e22" : ui === "active" ? "rgba(0,198,224,0.15)" : "var(--bg-hover)",
                              color: ui === "done" ? "#22c55e" : ui === "active" ? "var(--cyan)" : "var(--text-muted)",
                              border: `1px solid ${ui === "done" ? "#22c55e44" : ui === "active" ? "rgba(0,198,224,0.3)" : "var(--border)"}`,
                              borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                            }}>
                              {ui === "done" ? "✓ Approved" : ui === "active" ? "● Active" : "Pending"}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 6 }}>
                            {STAGE_ACTION[activeStage.stageType]}
                          </p>
                        </div>
                      </div>

                      {/* Responsible role */}
                      <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                        <div style={{ background: isAiStage ? "rgba(0,198,224,0.12)" : "#a855f722", border: `1px solid ${isAiStage ? "rgba(0,198,224,0.3)" : "#a855f744"}`, borderRadius: 8, padding: "6px 12px" }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>RESPONSIBLE</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isAiStage ? "var(--cyan)" : "#c084fc" }}>
                            {activeStage.assignee?.name || STAGE_ROLE[activeStage.stageType]}
                          </div>
                          {activeStage.assignee && (
                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{activeStage.assignee.role.replace(/_/g, " ")}</div>
                          )}
                        </div>
                        {activeStage.humanNotes && (
                          <div style={{ flex: 1, background: "#1a5cff12", border: "1px solid #1a5cff33", borderRadius: 8, padding: "6px 12px" }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 1 }}>REVIEWER NOTES</div>
                            <div style={{ fontSize: 12, color: "#93c5fd" }}>{activeStage.humanNotes}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI output summary if present */}
                    {aiParsed && (
                      <div style={{ background: "rgba(0,198,224,0.06)", border: "1px solid rgba(0,198,224,0.2)", borderRadius: 12, padding: 16 }}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--cyan)" }}>AI Output</div>
                        {aiParsed.projectSummary && <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 8 }}>{aiParsed.projectSummary}</p>}
                        {aiParsed.aiRecommendation && (
                          <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 6 }}>✓ {aiParsed.aiRecommendation}</div>
                        )}
                        {aiParsed.structuralWarnings?.map((w: string) => (
                          <div key={w} style={{ fontSize: 11, color: "#fcd34d", marginBottom: 3 }}>⚠ {w}</div>
                        ))}
                      </div>
                    )}

                    {/* What happens next */}
                    {nextStage && (
                      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Next Step</div>
                        <div className="flex items-center gap-3">
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                            {STAGE_ICON[nextStage.stageType]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{STAGE_LABEL[nextStage.stageType]}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                              Responsible: <span style={{ color: "var(--text-secondary)" }}>{STAGE_ROLE[nextStage.stageType]}</span>
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{STAGE_ACTION[nextStage.stageType]}</div>
                          </div>
                        </div>
                        {nextStage.stageType.startsWith("AI_") && ui === "active" && (
                          <div className="mt-3 flex gap-2">
                            <Link href={`/studio?projectId=${project.id}`}
                              style={{ background: "var(--cyan)", color: "#000", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
                              🤖 Run AI Now
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Full workflow timeline — all stages */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                      <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Full Workflow Timeline</div>
                      <div className="flex flex-col gap-0">
                        {project.stages.map((s, i) => {
                          const sui = stageUiStatus(s);
                          const isCurrent = s.id === activeStageId;
                          return (
                            <div key={s.id} className="flex gap-3 cursor-pointer" onClick={() => setActiveStageId(s.id)}
                              style={{ padding: "10px 8px", borderRadius: 8, background: isCurrent ? "rgba(0,198,224,0.07)" : "transparent" }}>
                              {/* connector line */}
                              <div className="flex flex-col items-center" style={{ width: 20, flexShrink: 0 }}>
                                <div style={{
                                  width: 20, height: 20, borderRadius: "50%", fontSize: 9, fontWeight: 700,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  background: sui === "done" ? "#22c55e" : sui === "active" ? "var(--cyan)" : "var(--bg-hover)",
                                  color: sui === "done" || sui === "active" ? "#000" : "var(--text-muted)",
                                  border: sui === "pending" ? "1px solid var(--border)" : "none", flexShrink: 0,
                                }}>{sui === "done" ? "✓" : i + 1}</div>
                                {i < project.stages.length - 1 && (
                                  <div style={{ width: 1, flex: 1, minHeight: 12, background: sui === "done" ? "#22c55e66" : "var(--border)", marginTop: 2 }} />
                                )}
                              </div>
                              <div style={{ flex: 1, paddingBottom: 8 }}>
                                <div className="flex items-center justify-between">
                                  <span style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? "var(--cyan)" : sui === "done" ? "var(--text-secondary)" : sui === "active" ? "var(--text-primary)" : "var(--text-muted)" }}>
                                    {STAGE_LABEL[s.stageType]}
                                  </span>
                                  <span style={{ fontSize: 10, color: sui === "done" ? "#22c55e" : sui === "active" ? "var(--cyan)" : "var(--text-muted)" }}>
                                    {sui === "done" ? "Approved" : sui === "active" ? "Active" : "Pending"}
                                  </span>
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                                  {s.assignee?.name || STAGE_ROLE[s.stageType]}
                                  {s.comments.length > 0 && <span style={{ marginLeft: 8, color: "var(--cyan)" }}>💬 {s.comments.length}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action buttons for active human stages */}
                    {ui === "active" && !isAiStage && me && STAGE_AUTH_ROLE[activeStage.stageType]?.includes(me.role) && (
                      <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,198,224,0.25)", borderRadius: 12, padding: 16 }}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cyan)" }}>Your Decision</div>
                        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                          placeholder="Add notes or reason (optional)..." rows={2}
                          style={{ width: "100%", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "var(--text-primary)", outline: "none", resize: "none", marginBottom: 10 }}
                          onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                          onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                        <div className="flex gap-2 flex-wrap">
                          {actionMsg && <span style={{ width: "100%", color: "#22c55e", fontSize: 12, marginBottom: 4 }}>{actionMsg}</span>}
                          <button onClick={() => handleApprove("approved")} disabled={submitting}
                            style={{ background: "#22c55e", color: "#000", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 700, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer", flex: 1 }}>
                            ✓ Approve & Advance
                          </button>
                          <button onClick={() => handleApprove("rejected")} disabled={submitting}
                            style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer" }}>
                            ✕ Reject
                          </button>
                          <button onClick={() => handleApprove("sent_back")} disabled={submitting}
                            style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: submitting ? "not-allowed" : "pointer" }}>
                            ↩ Send Back to AI
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cost summary if available */}
                    {cost && (
                      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Cost Estimate</div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ["Total Range", `ETB ${Math.round((cost.totalMin || 0)).toLocaleString()} – ETB ${Math.round((cost.totalMax || 0)).toLocaleString()}`, "var(--cyan)"],
                            ["Structure", `ETB ${Math.round((cost.structure || 0)).toLocaleString()}`, "var(--text-primary)"],
                            ["MEP", `ETB ${Math.round((cost.mep || 0)).toLocaleString()}`, "var(--text-primary)"],
                            ["Labour", `ETB ${Math.round((cost.labour || 0)).toLocaleString()}`, "var(--text-primary)"],
                          ].map(([label, val, color]) => (
                            <div key={label as string} style={{ background: "var(--bg-base)", borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: color as string }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── 3D RENDER / FULL AI STUDIO LINK ── */}
              {view === "floor" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative" style={{ minHeight: "100%", background: "#080f18" }}>
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08 }}>
                    <defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#00c6e0" strokeWidth="0.5" />
                    </pattern></defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                  <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🏙️</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--cyan)", marginBottom: 8 }}>AI Studio Workspace</div>
                    <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginBottom: 32, maxWidth: 400 }}>
                      All photorealistic 3D renders, elevations, section cuts, and AI architectural drawings are now generated and managed in the full AI Studio.
                    </div>
                    <Link 
                      href={`/studio?projectId=${project?.id}`}
                      style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", textDecoration: "none", display: "inline-block", boxShadow: "0 4px 20px rgba(0, 198, 224, 0.4)" }}
                    >
                      🤖 Open in Full AI Studio
                    </Link>
                  </div>
                </div>
              )}

              {/* ── PROJECT INFO ── */}
              {view === "info" && (
                <div className="p-5">
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, maxWidth: 500 }}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cyan)" }}>Project Details</div>
                    {[
                      ["Name", project.name], ["Client", project.clientName],
                      ["Type", project.projectType], ["Location", project.location || "—"],
                      ["Plot Size", project.plotSize || "—"], ["Status", statusLabel],
                      ["Progress", `${project.progress}%`],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between py-2" style={{ borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                        <span style={{ color: "var(--text-muted)" }}>{k}</span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                    {project.description && <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{project.description}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Comments + AI Insights */}
          <div style={{ width: 270, minWidth: 270, background: "var(--bg-panel)", borderLeft: "1px solid var(--border)", overflowY: "auto" }}>
            <div className="p-4 flex flex-col gap-4">

              {/* AI insights from active stage */}
              {activeStage?.aiOutput && (() => {
                try {
                  const p = JSON.parse(activeStage.aiOutput);
                  const warnings = p.structuralWarnings || [];
                  const rec = p.aiRecommendation;
                  if (!warnings.length && !rec) return null;
                  return (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>AI Notes</div>
                      <div className="flex flex-col gap-2">
                        {rec && <div style={{ background: "rgba(0,198,224,0.08)", border: "1px solid rgba(0,198,224,0.2)", borderRadius: 9, padding: "9px 11px", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                          <span style={{ color: "var(--cyan)", fontWeight: 700 }}>✓ AI:</span> {rec}
                        </div>}
                        {warnings.map((w: string) => (
                          <div key={w} style={{ background: "#f59e0b12", border: "1px solid #f59e0b33", borderRadius: 9, padding: "9px 11px", fontSize: 11, color: "#fcd34d", lineHeight: 1.6 }}>
                            ⚠ {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch { return null; }
              })()}

              {/* Comments */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                  Comments ({allComments.length})
                </div>
                <div className="flex flex-col gap-2">
                  {allComments.length === 0 && (
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No comments yet.</div>
                  )}
                  {allComments.map((c) => (
                    <div key={c.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{c.user.name}</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{timeAgo(c.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--cyan)", marginBottom: 4 }}>{c.user.role.replace(/_/g, " ")}</div>
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>{c.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post comment */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Add Comment</div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your review note..." rows={3}
                  style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 10px", fontSize: 12, color: "var(--text-primary)", outline: "none", resize: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                <button onClick={handleComment} disabled={submitting || !comment.trim()}
                  style={{ width: "100%", background: comment.trim() ? "var(--cyan)" : "var(--bg-hover)", color: comment.trim() ? "#000" : "var(--text-muted)", border: "none", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, cursor: comment.trim() ? "pointer" : "not-allowed", marginTop: 6 }}>
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
