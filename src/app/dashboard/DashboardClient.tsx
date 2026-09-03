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

const TYPE_COLOR: Record<string, string> = {
  Residential: "#1a5cff",
  Commercial: "#a855f7",
  Public: "#22c55e",
  Industrial: "#f59e0b",
};

const PIPELINE_COLUMNS = [
  { id: "BRIEF", title: "Brief & AI Concept", stages: ["CLIENT_BRIEF", "AI_GENERATION"], actionableRoles: ["PROMPTER"] },
  { id: "PROMPTER", title: "Prompter Review", stages: ["PROMPTER_REVIEW"], actionableRoles: ["PROMPTER"] },
  { id: "ARCH", title: "Architecture", stages: ["ARCHITECT_REVIEW"], actionableRoles: ["ARCHITECT"] },
  { id: "STRUCTURAL", title: "Engineering", stages: ["STRUCTURAL_REVIEW"], actionableRoles: ["STRUCTURAL_ENGINEER"] },
  { id: "COST", title: "Cost & QS", stages: ["QS_REVIEW"], actionableRoles: ["QUANTITY_SURVEYOR"] },
  { id: "PM", title: "PM Approval", stages: ["PM_APPROVAL"], actionableRoles: ["PROJECT_MANAGER"] },
  { id: "DELIVERED", title: "Delivered", stages: ["FINAL_DELIVERY"], actionableRoles: [] },
];

const ROLES = [
  { id: "ALL", label: "👁 View All (Admin)" },
  { id: "PROMPTER", label: "👨‍💼 Client / Prompter" },
  { id: "ARCHITECT", label: "📐 Human Architect" },
  { id: "STRUCTURAL_ENGINEER", label: "🏗 Structural Engineer" },
  { id: "QUANTITY_SURVEYOR", label: "📊 Quantity Surveyor" },
  { id: "PROJECT_MANAGER", label: "👔 Project Manager" },
];

function getActiveStageType(stages: Stage[]) {
  const active = stages.find((s) => s.status === "AWAITING_HUMAN" || s.status === "AI_RUNNING" || s.status === "PENDING");
  if (active) return active.stageType;
  const last = [...stages].reverse().find((s) => s.status === "APPROVED");
  if (last) return last.stageType;
  return "UNKNOWN";
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
  const [activeRole, setActiveRole] = useState("ALL");
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

  async function handleDeleteProject(e: React.MouseEvent, id: string) {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== id));
      } else {
        alert("Failed to delete project");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting project");
    }
  }

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.clientName.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active="dashboard" />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel shrink-0">
          <div>
            <h1 className="text-xl font-bold">Project Pipeline</h1>
            <p className="text-xs mt-0.5 text-text-muted">
              Company workflow overview — {projects.length} active project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
              <span className="text-xs font-bold text-text-muted">ROLE:</span>
              <select 
                value={activeRole} 
                onChange={e => setActiveRole(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-semibold text-cyan cursor-pointer appearance-none"
              >
                {ROLES.map(r => <option key={r.id} value={r.id} className="bg-panel text-text-primary">{r.label}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-card border border-border text-text-secondary focus-within:border-cyan transition-colors">
              <span>🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="bg-transparent border-none outline-none text-text-secondary text-[13px] w-32"
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

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex h-full gap-4 min-w-max pb-4">
            {PIPELINE_COLUMNS.map((col) => {
              const colProjects = filtered.filter(p => {
                const activeStageType = getActiveStageType(p.stages);
                // Force into Delivered if COMPLETED, but we also want it to remain in all past columns
                if (p.status === "COMPLETED") return true; 
                
                if (col.stages.includes(activeStageType)) return true;
                
                // If it has passed this column, show it as historical
                const hasApprovedStageInCol = p.stages.some(s => col.stages.includes(s.stageType) && s.status === "APPROVED");
                if (hasApprovedStageInCol) return true;

                return false;
              });
              
              const isMyAction = col.actionableRoles.includes(activeRole);
              const columnBg = isMyAction ? "bg-cyan/5 border-cyan/30" : "bg-panel border-border";

              return (
                <div key={col.id} className={`w-[320px] flex flex-col rounded-xl border ${columnBg} shrink-0`}>
                  <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${isMyAction ? 'text-cyan' : 'text-text-primary'}`}>
                        {col.title}
                      </h3>
                      <span className="bg-card text-text-muted text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {colProjects.length}
                      </span>
                    </div>
                    {isMyAction && <span className="text-[10px] bg-cyan text-black px-1.5 py-0.5 rounded font-bold">YOUR TURN</span>}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {colProjects.length === 0 ? (
                      <div className="text-center p-4 text-text-muted text-xs border border-dashed border-border/50 rounded-lg">
                        No projects
                      </div>
                    ) : (
                      colProjects.map(p => {
                        const typeColor = TYPE_COLOR[p.projectType] || "#4a6480";
                        const activeStageType = getActiveStageType(p.stages);
                        
                        // Check if this project is currently active IN THIS SPECIFIC COLUMN
                        const isCurrentlyInThisCol = col.stages.includes(activeStageType) && p.status !== "COMPLETED";
                        const isDoneInThisCol = !isCurrentlyInThisCol;
                        
                        const activeStageObj = p.stages.find(s => s.stageType === activeStageType);
                        
                        // Action required UI (only if active in THIS column)
                        const needsAction = isMyAction && isCurrentlyInThisCol && activeStageObj?.status !== "APPROVED";

                        return (
                          <Link key={p.id} href={`/workspace/${p.id}`}>
                            <div className={`bg-card border ${needsAction ? 'border-cyan shadow-[0_0_10px_rgba(0,198,224,0.15)]' : 'border-border'} ${isDoneInThisCol ? 'opacity-70 hover:opacity-100' : ''} rounded-xl p-4 hover:border-cyan hover:-translate-y-0.5 transition-all cursor-pointer`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="font-semibold text-sm line-clamp-1">{p.name}</div>
                                <div className="flex items-center gap-2">
                                  <span style={{ background: typeColor + "15", color: typeColor, border: `1px solid ${typeColor}33` }} className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                    {p.projectType}
                                  </span>
                                  <button 
                                    onClick={(e) => handleDeleteProject(e, p.id)}
                                    className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                    title="Delete project"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="text-xs text-text-muted mb-4">{p.clientName}</div>
                              
                              <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${needsAction ? 'bg-cyan animate-pulse' : (isDoneInThisCol ? 'bg-text-muted' : 'bg-green-500')}`} />
                                  <span className="text-[10px] font-bold text-text-secondary">
                                    {isDoneInThisCol ? "DONE" : (activeStageObj?.status === "AI_RUNNING" ? "AI WORKING..." : (needsAction ? "ACTION REQUIRED" : "IN PROGRESS"))}
                                  </span>
                                </div>
                                <span className="text-[10px] text-text-muted">{timeAgo(p.updatedAt)}</span>
                              </div>
                            </div>
                          </Link>
                        )
                      })
                    )}
                  </div>
                </div>
              );
            })}
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
