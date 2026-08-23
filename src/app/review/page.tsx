"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

const reviewItems = [
  {
    id: "1",
    project: "Villa A – Addis Ababa",
    stage: "Structural Review",
    stageColor: "#1a5cff",
    aiOutput: "AI Structural Reasoner has analyzed the floor plan. Beam spans at grid lines C-D and E-F are within acceptable limits. Column grid is regular at 4.5m × 5.0m. Foundation type recommended: Strip foundation on hard laterite soil. Estimated dead load: 8.5 kN/m². Wind load analysis: Zone 2 Ethiopia (0.5 kN/m²). No critical structural risks detected.",
    warnings: [
      "Beam at column C-3 has 6.2m span — consider intermediate support",
      "Roof pitch (10°) may accumulate water in heavy rain season",
    ],
    role: "Structural Engineer",
    roleColor: "#1a5cff",
    submittedBy: "AI Structural Reasoner",
    time: "2 hours ago",
  },
  {
    id: "2",
    project: "Commercial Office B",
    stage: "Cost Estimation",
    stageColor: "#a855f7",
    aiOutput: "AI Cost Estimator has produced BOQ for Option A layout. Total floor area: 620m². Material costs calculated using current Addis Ababa market rates (Q2 2025). Labour rates applied from ECEG standard schedule.",
    warnings: [
      "Steel price increase of 8% expected in Q3 — front-load procurement",
    ],
    role: "Quantity Surveyor",
    roleColor: "#a855f7",
    submittedBy: "AI Cost Estimator",
    time: "5 hours ago",
  },
];

export default function ReviewPage() {
  const [activeItem, setActiveItem] = useState("1");
  const [comment, setComment] = useState("");
  const [signature, setSignature] = useState("");
  const [signed, setSigned] = useState(false);

  const current = reviewItems.find((r) => r.id === activeItem)!;

  function handleApprove() {
    if (signature.length > 2) setSigned(true);
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar active="review" />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}
          className="flex items-center justify-between px-6 py-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold">Human Role Review</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Review AI output and approve or reject each stage</p>
          </div>
          <div style={{ background: "#f59e0b22", border: "1px solid #f59e0b44", color: "#f59e0b", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
            ⏳ {reviewItems.length} Awaiting Review
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Item list */}
          <div style={{ width: 280, minWidth: 280, background: "var(--bg-panel)", borderRight: "1px solid var(--border)", overflowY: "auto" }} className="p-3">
            <div className="text-xs font-semibold uppercase tracking-widest mb-3 px-2" style={{ color: "var(--text-muted)" }}>Pending Reviews</div>
            {reviewItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveItem(item.id); setSigned(false); setComment(""); setSignature(""); }}
                style={{
                  width: "100%", textAlign: "left", background: activeItem === item.id ? "rgba(0,198,224,0.1)" : "transparent",
                  border: activeItem === item.id ? "1px solid rgba(0,198,224,0.25)" : "1px solid transparent",
                  borderRadius: 10, padding: "12px", cursor: "pointer", marginBottom: 6,
                }}>
                <div className="font-semibold text-sm mb-1" style={{ color: activeItem === item.id ? "var(--cyan)" : "var(--text-primary)" }}>{item.project}</div>
                <div style={{ color: item.stageColor, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>● {item.stage}</div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.role}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.time}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Review panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {signed ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div style={{ width: 80, height: 80, background: "#22c55e22", border: "2px solid #22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>✓</div>
                <div className="text-2xl font-bold" style={{ color: "#22c55e" }}>Stage Approved</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, textAlign: "center", maxWidth: 400 }}>
                  Your signature and approval have been recorded. The project will automatically advance to the next workflow stage.
                </p>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, textAlign: "center", maxWidth: 300 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Digitally signed by</div>
                  <div style={{ fontFamily: "cursive", fontSize: 24, color: "var(--cyan)", marginBottom: 4 }}>{signature}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{current.role} · {new Date().toLocaleString()}</div>
                </div>
                <button onClick={() => { setSigned(false); setSignature(""); setComment(""); }}
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer" }}>
                  Review Next
                </button>
              </div>
            ) : (
              <>
                {/* Project header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold mb-1">{current.project}</h2>
                    <div className="flex items-center gap-3">
                      <span style={{ background: current.stageColor + "22", color: current.stageColor, border: `1px solid ${current.stageColor}44`, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{current.stage}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Submitted by {current.submittedBy}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{current.time}</span>
                    </div>
                  </div>
                  <div style={{ background: current.roleColor + "22", border: `1px solid ${current.roleColor}44`, color: current.roleColor, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700 }}>
                    {current.role}
                  </div>
                </div>

                {/* AI Output */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>AI Analysis Output</div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>{current.aiOutput}</p>
                </div>

                {/* Warnings */}
                {current.warnings.length > 0 && (
                  <div style={{ background: "#f59e0b0a", border: "1px solid #f59e0b33", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#f59e0b" }}>⚠ Flagged Items</div>
                    {current.warnings.map((w, i) => (
                      <div key={i} className="flex gap-2 items-start" style={{ marginBottom: 6 }}>
                        <span style={{ color: "#f59e0b", fontSize: 12 }}>→</span>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment box */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Your Review Comments</div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Add your professional comments, corrections, or conditions for approval..."
                    style={{
                      width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)",
                      color: "var(--text-primary)", borderRadius: 9, padding: "10px 12px", fontSize: 13,
                      outline: "none", resize: "none",
                    }}
                  />
                </div>

                {/* Signature + actions */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Digital Signature & Decision</div>
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Type your full name to sign..."
                      style={{
                        flex: 1, background: "var(--bg-panel)", border: "1px solid var(--border)",
                        color: "var(--text-primary)", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none",
                        fontFamily: signature ? "cursive" : "inherit",
                      }}
                    />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleApprove}
                      disabled={signature.length < 3}
                      style={{
                        background: signature.length >= 3 ? "#22c55e" : "#22c55e55",
                        color: "#000", border: "none", borderRadius: 9, padding: "11px 28px",
                        fontWeight: 700, fontSize: 14, cursor: signature.length >= 3 ? "pointer" : "not-allowed",
                      }}>
                      ✓ Approve & Sign
                    </button>
                    <button style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444", borderRadius: 9, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      ✗ Reject
                    </button>
                    <button style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 9, padding: "11px 20px", fontSize: 14, cursor: "pointer" }}>
                      ↩ Send Back to AI
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
