"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export interface Stage {
  stageType: string;
  status: string;
  stageOrder: number;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  projectType: string;
  status: string;
  progress: number;
  updatedAt: string;
  stages: Stage[];
}

const STAGE_LABELS: Record<string, string> = {
  CLIENT_BRIEF: "Client Brief",
  AI_ARCHITECT: "AI Architect",
  HUMAN_ARCHITECT: "Human Architect",
  AI_STRUCTURAL: "Structural Analysis",
  HUMAN_STRUCTURAL: "Engineer Review",
  AI_COST: "Cost Estimation",
  HUMAN_QS: "QS Review",
  PM_APPROVAL: "PM Approval",
  FINAL_DELIVERY: "Delivered",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#4a6480",
  IN_PROGRESS: "#f59e0b",
  AWAITING_REVIEW: "#00c6e0",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
};

const TYPE_COLOR: Record<string, string> = {
  Residential: "#1a5cff",
  Commercial: "#a855f7",
  Public: "#22c55e",
  Industrial: "#f59e0b",
};

function currentStageLabel(stages: Stage[]) {
  const active = stages.find((s) => s.status === "AWAITING_HUMAN" || s.status === "AI_RUNNING");
  if (active) return STAGE_LABELS[active.stageType] || active.stageType;
  const last = [...stages].reverse().find((s) => s.status === "APPROVED");
  if (last) return STAGE_LABELS[last.stageType] || last.stageType;
  return "Not started";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface DashboardClientProps {
  initialProjects: Project[];
  userName: string;
}

export default function DashboardClient({ initialProjects, userName }: DashboardClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // new project form state
  const [pName, setPName] = useState("");
  const [pClient, setPClient] = useState("");
  const [pType, setPType] = useState("Residential");
  const [pLocation, setPLocation] = useState("");
  const [pPlot, setPPlot] = useState("");
  const [pMode, setPMode] = useState("CERTIFIED");
  const [pDesc, setPDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pName,
          clientName: pClient,
          projectType: pType,
          location: pLocation,
          plotSize: pPlot,
          mode: pMode,
          description: pDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create project");
        return;
      }
      
      // Optimistic update (or simply rely on redirect)
      setProjects((prev) => [data.project, ...prev]);
      setShowModal(false);
      setPName("");
      setPClient("");
      setPLocation("");
      setPPlot("");
      setPDesc("");
      router.push(`/workspace/${data.project.id}`);
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const filtered = projects.filter((p) => {
    const matchType = filter === "All" || p.projectType === filter;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const stats = [
    { label: "Total Projects", value: projects.length, icon: "📁", color: "#00c6e0" },
    { label: "In Progress", value: projects.filter((p) => p.status === "IN_PROGRESS").length, icon: "⏳", color: "#f59e0b" },
    { label: "Awaiting Review", value: projects.filter((p) => p.status === "AWAITING_REVIEW").length, icon: "👁", color: "#1a5cff" },
    { label: "Completed", value: projects.filter((p) => p.status === "COMPLETED").length, icon: "✅", color: "#22c55e" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active="dashboard" />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10 border-b border-border bg-panel">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-xs mt-0.5 text-text-muted">
              Welcome back, {userName} — {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-card border border-border text-text-secondary focus-within:border-cyan transition-colors">
              <span>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="bg-transparent border-none outline-none text-text-secondary text-[13px] w-40"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-cyan text-black hover:opacity-90 transition-opacity shadow-sm"
            >
              + New Project
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl p-4 flex items-center gap-4 bg-card border border-border hover:border-cyan/50 transition-colors">
                <div style={{ background: s.color + "22", color: s.color }} className="w-11 h-11 text-[22px] rounded-[10px] flex items-center justify-center">
                  {s.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: s.color }}>
                    {s.value}
                  </div>
                  <div className="text-xs text-text-muted">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">All Projects</h2>
              <div className="flex gap-2 flex-wrap">
                {["All", "Residential", "Commercial", "Public", "Industrial"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`border rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      filter === f
                        ? "bg-cyan text-black border-cyan"
                        : "bg-card text-text-secondary border-border hover:bg-hover"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted">
                <div className="text-5xl opacity-50 grayscale">📁</div>
                <div className="text-base font-semibold">No projects found</div>
                <p className="text-sm text-center max-w-xs opacity-75">
                  {search || filter !== "All"
                    ? "Try adjusting your filters or search term."
                    : "Create your first project to start the AI-powered construction workflow."}
                </p>
                {!(search || filter !== "All") && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-cyan text-black border-none rounded-lg px-6 py-2.5 font-bold text-[13px] hover:opacity-90 transition-opacity mt-2"
                  >
                    + Create First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((p) => {
                  const stageLabel = currentStageLabel(p.stages);
                  const typeColor = TYPE_COLOR[p.projectType] || "#4a6480";
                  const statusColor = STATUS_COLOR[p.status] || "#4a6480";
                  const statusLabel = p.status.replace("_", " ");
                  return (
                    <Link key={p.id} href={`/workspace/${p.id}`}>
                      <div className="bg-card border border-border rounded-xl p-5 hover:border-cyan hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold text-sm group-hover:text-cyan transition-colors">
                                {p.name}
                              </div>
                              <div className="text-xs mt-0.5 text-text-muted line-clamp-1">
                                {p.clientName}
                              </div>
                            </div>
                            <span
                              style={{ background: typeColor + "15", color: typeColor, border: `1px solid ${typeColor}33` }}
                              className="rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide"
                            >
                              {p.projectType}
                            </span>
                          </div>
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-cyan truncate">
                                ● {stageLabel}
                              </span>
                              <span className="text-[11px] text-text-muted font-mono">{p.progress}%</span>
                            </div>
                            <div className="bg-panel rounded-full h-1.5 overflow-hidden border border-border/50">
                              <div
                                className="bg-cyan h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <span
                            style={{ background: statusColor + "15", color: statusColor, border: `1px solid ${statusColor}33` }}
                            className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                          >
                            {statusLabel}
                          </span>
                          <span className="text-[11px] text-text-muted">{timeAgo(p.updatedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* NEW PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-card z-10 rounded-t-2xl">
              <div>
                <div className="font-bold text-base flex items-center gap-3">
                  New Project
                  <button type="button" onClick={() => { setPName("Luxury Villa - Bole"); setPClient("Abebe Kebede"); setPLocation("Bole, Addis Ababa"); setPPlot("500m²"); setPType("Residential"); setPMode("AI_DRAFT"); setPDesc("A luxurious 3-story modern residential villa with large glass windows, a rooftop terrace, and a spacious living room. Needs a high-end 3D exterior render."); }} className="bg-cyan/10 text-cyan text-[10px] px-2 py-1 rounded-md border border-cyan/20 hover:bg-cyan/20 transition-colors cursor-pointer">✨ Autofill Demo</button>
                </div>
                <div className="text-xs mt-0.5 text-text-muted">
                  Create a project and start the AI workflow
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="bg-hover border border-border text-text-secondary hover:text-text-primary rounded-lg w-8 h-8 flex items-center justify-center text-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[
                  { label: "Project Name *", value: pName, setter: setPName, placeholder: "Villa A – Addis Ababa", required: true },
                  { label: "Client Name *", value: pClient, setter: setPClient, placeholder: "Ato Bekele T.", required: true },
                  { label: "Location", value: pLocation, setter: setPLocation, placeholder: "Bole, Addis Ababa", required: false },
                  { label: "Plot Size", value: pPlot, setter: setPPlot, placeholder: "400m²", required: false },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">
                      {f.label}
                    </label>
                    <input
                      value={f.value}
                      onChange={(e) => f.setter(e.target.value)}
                      placeholder={f.placeholder}
                      required={f.required}
                      className="w-full bg-panel border border-border text-text-primary rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/20 transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">
                    Project Type *
                  </label>
                  <select
                    value={pType}
                    onChange={(e) => setPType(e.target.value)}
                    required
                    className="w-full bg-panel border border-border text-text-primary rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/20 transition-all appearance-none cursor-pointer"
                  >
                    {["Residential", "Commercial", "Public", "Industrial"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">
                    Workflow Mode
                  </label>
                  <select
                    value={pMode}
                    onChange={(e) => setPMode(e.target.value)}
                    className="w-full bg-panel border border-border text-text-primary rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="CERTIFIED">🛡 Certified (Human Review)</option>
                    <option value="AI_DRAFT">⚡ AI Draft (Auto)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">
                  Project Brief / Description
                </label>
                <textarea
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe the project requirements, style preferences, special requirements..."
                  className="w-full bg-panel border border-border text-text-primary rounded-xl px-3 py-2.5 text-[13px] outline-none resize-none focus:border-cyan focus:ring-1 focus:ring-cyan/20 transition-all"
                />
              </div>

              {createError && (
                <div className="bg-red/10 border border-red/20 text-red rounded-xl p-3 text-[13px] flex items-center gap-2">
                  <span>⚠</span> {createError}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-hover border border-border text-text-secondary rounded-xl py-3 text-[13px] font-semibold hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`flex-[2] text-black border-none rounded-xl py-3 text-[13px] font-bold transition-all ${
                    creating ? "bg-cyan-dim cursor-not-allowed opacity-70" : "bg-cyan cursor-pointer hover:opacity-90 shadow-lg shadow-cyan/20"
                  }`}
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "🚀 Create & Open Workspace"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
