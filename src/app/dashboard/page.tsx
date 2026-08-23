"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface Stage { stageType: string; status: string; stageOrder: number; }
interface Project {
  id: string; name: string; clientName: string; projectType: string;
  status: string; progress: number; updatedAt: string;
  stages: Stage[];
}

const STAGE_LABELS: Record<string, string> = {
  CLIENT_BRIEF: "Client Brief", AI_ARCHITECT: "AI Architect",
  HUMAN_ARCHITECT: "Human Architect", AI_STRUCTURAL: "Structural Analysis",
  HUMAN_STRUCTURAL: "Engineer Review", AI_COST: "Cost Estimation",
  HUMAN_QS: "QS Review", PM_APPROVAL: "PM Approval", FINAL_DELIVERY: "Delivered",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#4a6480", IN_PROGRESS: "#f59e0b", AWAITING_REVIEW: "#00c6e0",
  COMPLETED: "#22c55e", CANCELLED: "#ef4444",
};
const TYPE_COLOR: Record<string, string> = {
  Residential: "#1a5cff", Commercial: "#a855f7", Public: "#22c55e", Industrial: "#f59e0b",
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

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState("User");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setProjects(data.projects || []);
    } catch { /* network error */ }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        setUserName(d.user.name?.split(" ")[0] || "User");
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
    fetchProjects();
  }, [fetchProjects]);

  function handleCreateClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setShowModal(true);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setCreateError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pName, clientName: pClient, projectType: pType, location: pLocation, plotSize: pPlot, mode: pMode, description: pDesc }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || "Failed to create project"); return; }
      setShowModal(false);
      setPName(""); setPClient(""); setPLocation(""); setPPlot(""); setPDesc("");
      router.push(`/workspace/${data.project.id}`);
    } catch { setCreateError("Network error"); }
    finally { setCreating(false); }
  }

  const filtered = projects.filter((p) => {
    const matchType = filter === "All" || p.projectType === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.clientName.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const stats = [
    { label: "Total Projects", value: projects.length, icon: "📁", color: "#00c6e0" },
    { label: "In Progress", value: projects.filter((p) => p.status === "IN_PROGRESS").length, icon: "⏳", color: "#f59e0b" },
    { label: "Awaiting Review", value: projects.filter((p) => p.status === "AWAITING_REVIEW").length, icon: "👁", color: "#1a5cff" },
    { label: "Completed", value: projects.filter((p) => p.status === "COMPLETED").length, icon: "✅", color: "#22c55e" },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar active="dashboard" />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}
          className="topbar flex items-center justify-between px-6 py-4 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Welcome back, {userName} — {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm">
              <span>🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..." style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-secondary)", fontSize: 13, width: 160 }} />
            </div>
            <button onClick={handleCreateClick}
              style={{ background: "var(--cyan)", color: "#000" }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
              + New Project
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                className="rounded-xl p-4 flex items-center gap-4">
                <div style={{ background: s.color + "22", fontSize: 22, borderRadius: 10 }} className="w-11 h-11 flex items-center justify-center">{s.icon}</div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
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
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ background: filter === f ? "var(--cyan)" : "var(--bg-card)", color: filter === f ? "#000" : "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20" style={{ color: "var(--text-muted)" }}>
                <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--cyan)", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 12 }} />
                Loading projects from database...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4" style={{ color: "var(--text-muted)" }}>
                <div className="text-5xl">📁</div>
                <div className="text-base font-semibold">No projects yet</div>
                <p className="text-sm text-center max-w-xs">Create your first project to start the AI-powered construction workflow.</p>
                <button onClick={handleCreateClick}
                  style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 9, padding: "10px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  + Create First Project
                </button>
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
                      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                        className="rounded-xl p-5 hover:border-cyan-500 transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-semibold text-sm group-hover:text-cyan-400 transition-colors">{p.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.clientName}</div>
                          </div>
                          <span style={{ background: typeColor + "22", color: typeColor, border: `1px solid ${typeColor}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                            {p.projectType}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs" style={{ color: "var(--cyan)", fontWeight: 600 }}>● {stageLabel}</span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{p.progress}%</span>
                          </div>
                          <div style={{ background: "var(--bg-panel)", borderRadius: 4, height: 5 }}>
                            <div style={{ background: "var(--cyan)", width: `${p.progress}%`, height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ background: statusColor + "22", color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                            {statusLabel}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(p.updatedAt)}</span>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ borderBottom: "1px solid var(--border)", padding: "18px 24px" }} className="flex items-center justify-between">
              <div>
                <div className="font-bold text-base">New Project</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Create a project and start the AI workflow</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { label: "Project Name *", value: pName, setter: setPName, placeholder: "Villa A – Addis Ababa", required: true },
                  { label: "Client Name *", value: pClient, setter: setPClient, placeholder: "Ato Bekele T.", required: true },
                  { label: "Location", value: pLocation, setter: setPLocation, placeholder: "Bole, Addis Ababa", required: false },
                  { label: "Plot Size", value: pPlot, setter: setPPlot, placeholder: "400m²", required: false },
                ].map((f) => (
                  <div key={f.label}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.placeholder} required={f.required}
                      style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none" }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Project Type *</label>
                  <select value={pType} onChange={(e) => setPType(e.target.value)} required
                    style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none" }}>
                    {["Residential", "Commercial", "Public", "Industrial"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Workflow Mode</label>
                  <select value={pMode} onChange={(e) => setPMode(e.target.value)}
                    style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none" }}>
                    <option value="CERTIFIED">🛡 Certified (Human Review)</option>
                    <option value="AI_DRAFT">⚡ AI Draft (Auto)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Project Brief / Description</label>
                <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={3}
                  placeholder="Describe the project requirements, style preferences, special requirements..."
                  style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none", resize: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </div>

              {createError && (
                <div style={{ background: "#ef444422", border: "1px solid #ef444466", color: "#ef4444", borderRadius: 9, padding: "10px 12px", fontSize: 13 }}>⚠ {createError}</div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 9, padding: "11px", fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  style={{ flex: 2, background: creating ? "var(--cyan-dim)" : "var(--cyan)", color: "#000", border: "none", borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: 13, cursor: creating ? "not-allowed" : "pointer" }}>
                  {creating ? "Creating..." : "🚀 Create & Open Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
