import Sidebar from "@/components/Sidebar";

const projects = [
  {
    name: "Villa A – Addis Ababa",
    id: "villa-a",
    events: [
      { stage: "Client Brief", actor: "Client (Bekele T.)", status: "done", time: "May 8, 09:15", note: "Project requirements submitted: 3BR villa, 400m² plot, modern style." },
      { stage: "AI Architect", actor: "AI Engine v2.3", status: "done", time: "May 8, 09:22", note: "Generated 3 concept options. Option A selected by client." },
      { stage: "Human Architect", actor: "Sara M. (Architect)", status: "done", time: "May 9, 14:30", note: "Reviewed and approved Option A with minor edits to bedroom layout." },
      { stage: "Structural Review", actor: "Eng. Bekele A.", status: "active", time: "May 11, 10:00", note: "AI structural analysis submitted. Human review in progress." },
      { stage: "Cost Estimation", actor: "QS Ahmed H.", status: "pending", time: "—", note: "Awaiting structural approval." },
      { stage: "PM Final Approval", actor: "Tigist B. (PM)", status: "pending", time: "—", note: "Final stage pending." },
    ],
  },
  {
    name: "Commercial Office B",
    id: "office-b",
    events: [
      { stage: "Client Brief", actor: "Selam Constructions", status: "done", time: "May 5, 11:00", note: "Office complex, 5 floors, open plan." },
      { stage: "AI Architect", actor: "AI Engine v2.3", status: "done", time: "May 5, 11:08", note: "Concepts generated." },
      { stage: "Human Architect", actor: "Dawit G.", status: "done", time: "May 6, 16:00", note: "Approved with revised facade." },
      { stage: "Structural Review", actor: "AI + Eng. Hanna", status: "done", time: "May 8, 12:00", note: "Structural analysis passed." },
      { stage: "Cost Estimation", actor: "QS Ahmed H.", status: "active", time: "May 11, 09:00", note: "BOQ being finalized." },
      { stage: "PM Final Approval", actor: "Tigist B.", status: "pending", time: "—", note: "Awaiting QS." },
    ],
  },
];

const statusConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  done: { color: "#22c55e", bg: "#22c55e22", icon: "✓", label: "Done" },
  active: { color: "#00c6e0", bg: "#00c6e022", icon: "⟳", label: "In Progress" },
  pending: { color: "#4a6480", bg: "#4a648022", icon: "○", label: "Pending" },
};

export default function TimelinePage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar active="timeline" />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}
          className="flex items-center justify-between px-6 py-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold">Timeline & Audit</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Full project history, approvals, and audit trail</p>
          </div>
          <button style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 8, padding: "7px 16px", fontSize: 12, cursor: "pointer" }}>
            ⬇ Export Audit Report
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {projects.map((project) => (
            <div key={project.id}>
              <div className="flex items-center gap-3 mb-5">
                <div style={{ background: "var(--cyan)", borderRadius: 6, width: 8, height: 8 }} />
                <h2 className="font-bold text-base">{project.name}</h2>
              </div>

              <div className="relative">
                {/* Vertical line */}
                <div style={{ position: "absolute", left: 15, top: 0, bottom: 0, width: 2, background: "var(--border)", zIndex: 0 }} />

                <div className="flex flex-col gap-4" style={{ paddingLeft: 44 }}>
                  {project.events.map((event, i) => {
                    const cfg = statusConfig[event.status];
                    return (
                      <div key={i} style={{ position: "relative" }}>
                        {/* Circle on timeline */}
                        <div style={{
                          position: "absolute", left: -36, top: 10,
                          width: 28, height: 28, borderRadius: "50%",
                          background: cfg.bg, border: `2px solid ${cfg.color}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, color: cfg.color, zIndex: 1,
                        }}>
                          {cfg.icon}
                        </div>

                        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px" }}>
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{event.stage}</span>
                              <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, borderRadius: 5, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{cfg.label}</span>
                            </div>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{event.time}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>by {event.actor}</div>
                          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{event.note}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
