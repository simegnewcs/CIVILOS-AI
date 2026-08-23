"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

const teamMembers = [
  { name: "Sara Mekonnen", role: "Architect", email: "sara@firm.com", color: "#00c6e0", status: "Active" },
  { name: "Bekele Assefa", role: "Structural Engineer", email: "bekele@firm.com", color: "#1a5cff", status: "Active" },
  { name: "Ahmed Hassan", role: "Quantity Surveyor", email: "ahmed@firm.com", color: "#a855f7", status: "Active" },
  { name: "Tigist Bekele", role: "Project Manager", email: "tigist@firm.com", color: "#22c55e", status: "Active" },
  { name: "Dawit Girma", role: "Architect", email: "dawit@firm.com", color: "#00c6e0", status: "Inactive" },
];

const roleColors: Record<string, string> = {
  "Architect": "#00c6e0",
  "Structural Engineer": "#1a5cff",
  "Quantity Surveyor": "#a855f7",
  "Project Manager": "#22c55e",
};

const tabs = ["General", "Team", "AI Settings", "Billing"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const [firmName, setFirmName] = useState("DEVVOLTZ Engineering");
  const [country, setCountry] = useState("Ethiopia");
  const [mode, setMode] = useState("certified");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar active="settings" />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}
          className="flex items-center px-6 py-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold">Settings & Teams</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Manage your workspace, team members, and AI preferences</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}
          className="flex gap-1 px-6 shrink-0">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid var(--cyan)" : "2px solid transparent",
                color: activeTab === tab ? "var(--cyan)" : "var(--text-secondary)",
                padding: "12px 16px",
                fontSize: 13,
                fontWeight: activeTab === tab ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* GENERAL TAB */}
          {activeTab === "General" && (
            <div className="max-w-xl space-y-5">
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                <h2 className="font-semibold text-sm mb-4">Firm Information</h2>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Firm Name", value: firmName, setter: setFirmName },
                    { label: "Country / Region", value: country, setter: setCountry },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>{field.label}</label>
                      <input
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        style={{
                          width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)",
                          color: "var(--text-primary)", borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                <h2 className="font-semibold text-sm mb-1">Default Workflow Mode</h2>
                <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Applied to all new projects by default</p>
                <div className="flex flex-col gap-3">
                  {[
                    { id: "certified", label: "Certified Workflow Mode", desc: "Human approval required at every stage. Legal-grade audit trail.", icon: "🛡️" },
                    { id: "draft", label: "AI Full Draft Mode", desc: "Fully automated. No human review. Fast concept generation only.", icon: "⚡" },
                  ].map((m) => (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      style={{
                        background: mode === m.id ? "rgba(0,198,224,0.1)" : "var(--bg-panel)",
                        border: mode === m.id ? "1px solid var(--cyan)" : "1px solid var(--border)",
                        borderRadius: 10, padding: "14px 16px", textAlign: "left", cursor: "pointer",
                      }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{m.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: mode === m.id ? "var(--cyan)" : "var(--text-primary)" }}>{m.label}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", paddingLeft: 22 }}>{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 9, padding: "11px 28px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Save Changes
              </button>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === "Team" && (
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-base">{teamMembers.length} Team Members</h2>
                <button style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  + Invite Member
                </button>
              </div>
              {teamMembers.map((member) => (
                <div key={member.email} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}
                  className="flex items-center gap-4">
                  <div style={{ background: member.color, borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#000", flexShrink: 0 }}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{member.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{member.email}</div>
                  </div>
                  <div style={{ background: roleColors[member.role] + "22", color: roleColors[member.role], border: `1px solid ${roleColors[member.role]}44`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {member.role}
                  </div>
                  <div style={{ background: member.status === "Active" ? "#22c55e22" : "var(--bg-hover)", color: member.status === "Active" ? "#22c55e" : "var(--text-muted)", border: `1px solid ${member.status === "Active" ? "#22c55e44" : "var(--border)"}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                    {member.status}
                  </div>
                  <button style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 7, padding: "5px 12px", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI SETTINGS TAB */}
          {activeTab === "AI Settings" && (
            <div className="max-w-xl space-y-5">
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                <h2 className="font-semibold text-sm mb-4">AI Engine Configuration</h2>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "LLM Provider", options: ["OpenAI GPT-4o", "Anthropic Claude 3.5", "Google Gemini Pro"] },
                    { label: "Cost Dataset", options: ["Ethiopia Q2 2025", "Ethiopia Q1 2025", "Custom Upload"] },
                    { label: "Building Standards", options: ["ESDA (Ethiopia)", "EC2 Eurocode", "ACI 318"] },
                    { label: "Default Output Language", options: ["English", "Amharic", "Arabic"] },
                  ].map((s) => (
                    <div key={s.label}>
                      <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>{s.label}</label>
                      <select style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 9, padding: "9px 12px", fontSize: 13, outline: "none" }}>
                        {s.options.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <button style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 9, padding: "11px 28px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Save AI Settings
              </button>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === "Billing" && (
            <div className="max-w-xl space-y-5">
              <div style={{ background: "linear-gradient(135deg, var(--blue-dim), var(--bg-card))", border: "1px solid var(--cyan)", borderRadius: 12, padding: 24 }}>
                <div style={{ color: "var(--cyan)", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>CURRENT PLAN</div>
                <div className="text-2xl font-bold mb-1">Medium Firm</div>
                <div className="text-3xl font-bold mb-4" style={{ color: "var(--cyan)" }}>$300<span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 400 }}>/month</span></div>
                <div className="flex flex-col gap-2">
                  {["Unlimited projects", "Certified Workflow Mode", "10 role seats", "Full audit trail"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "#22c55e" }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                <h2 className="font-semibold text-sm mb-3">Usage This Month</h2>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "AI Generations", used: 42, max: 100 },
                    { label: "Cost Estimates", used: 18, max: 50 },
                    { label: "Active Seats", used: 5, max: 10 },
                  ].map((u) => (
                    <div key={u.label}>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                        <span>{u.label}</span><span>{u.used}/{u.max}</span>
                      </div>
                      <div style={{ background: "var(--bg-panel)", borderRadius: 4, height: 6 }}>
                        <div style={{ background: "var(--cyan)", width: `${(u.used / u.max) * 100}%`, height: "100%", borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
