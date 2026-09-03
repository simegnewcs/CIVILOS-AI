"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", icon: "▦", label: "Dashboard" },
  { href: "/workspace", icon: "🏗", label: "Workspace" },
  { href: "/studio", icon: "🤖", label: "AI Studio" },
  { href: "/review", icon: "👷", label: "Review" },
  { href: "/timeline", icon: "📋", label: "Timeline" },
  { href: "/settings", icon: "⚙", label: "Settings" },
];

interface SidebarProps { active?: string; tryFree?: boolean; }
interface ChatMsg { role: "user" | "assistant"; text: string; }
interface Me { name: string; email: string; role: string; }

export default function Sidebar({ active, tryFree }: SidebarProps) {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", text: "Hi! Ask me anything about your project — design, structure, cost, or workflow steps." }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => { if (d?.user) setMe(d.user); });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setThinking(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      const reply = data.result?.projectSummary || data.result?.aiRecommendation ||
        (data.result?.options?.[0] ? `Option A: ${data.result.options[0].label} — ${data.result.options[0].styleTag}` : null) ||
        data.error || "I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Network error — please try again." }]);
    } finally {
      setThinking(false);
    }
  }

  // Persist the last visited workspace in localStorage so sidebar links directly
  useEffect(() => {
    const match = pathname.match(/^\/workspace\/([^/]+)/);
    if (match && match[1] !== "demo") {
      localStorage.setItem("lastWorkspaceId", match[1]);
    }
  }, [pathname]);

  const workspaceMatch = pathname.match(/^\/workspace\/([^/]+)/);
  const storedId = typeof window !== "undefined" ? localStorage.getItem("lastWorkspaceId") : null;
  const workspaceHref = workspaceMatch
    ? `/workspace/${workspaceMatch[1]}`
    : storedId
    ? `/workspace/${storedId}`
    : "/workspace/demo";
  const navItems = NAV.map(item => item.label === "Workspace" ? { ...item, href: workspaceHref } : item);

  const sideW = collapsed ? 60 : 220;

  const sidebarContent = (
    <aside style={{
      width: sideW, minWidth: sideW, background: "var(--bg-panel)",
      borderRight: "1px solid var(--border)", display: "flex",
      flexDirection: "column", height: "100%",
      transition: "width 0.2s ease, min-width 0.2s ease", overflow: "hidden",
    }}>

      {/* Logo + collapse toggle */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: collapsed ? "14px 0" : "14px 16px", display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "space-between", flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ background: "var(--cyan)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#000", flexShrink: 0 }}>C</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>CivilOS <span style={{ color: "var(--cyan)" }}>AI</span></div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Construction OS</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ background: "var(--cyan)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#000" }}>C</div>
        )}
        <button onClick={() => setCollapsed(c => !c)} title={collapsed ? "Expand" : "Collapse"}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, fontSize: 14, flexShrink: 0, lineHeight: 1, borderRadius: 6 }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--cyan)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: collapsed ? "8px 6px" : "8px 10px", flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {!collapsed && (
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", padding: "4px 8px 8px", textTransform: "uppercase" }}>Navigation</div>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href || active === item.label.toLowerCase();
          // In tryFree mode, all nav links go to login except studio
          const href = tryFree && item.href !== "/studio" ? "/login" : item.href;
          return (
            <Link key={item.href} href={href} title={collapsed ? item.label : undefined}
              style={{
                background: isActive ? "rgba(0,198,224,0.12)" : "transparent",
                color: isActive ? "var(--cyan)" : "var(--text-secondary)",
                border: isActive ? "1px solid rgba(0,198,224,0.25)" : "1px solid transparent",
                borderRadius: 9, padding: collapsed ? "10px 0" : "9px 12px",
                display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
                gap: 10, fontSize: 13, fontWeight: isActive ? 600 : 400,
                textDecoration: "none", transition: "all 0.15s", whiteSpace: "nowrap",
                opacity: tryFree && item.href !== "/studio" ? 0.6 : 1,
              }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && isActive && <div style={{ width: 6, height: 6, background: "var(--cyan)", borderRadius: "50%", flexShrink: 0 }} />}
              {!collapsed && tryFree && item.href !== "/studio" && <span style={{ fontSize: 10, color: "#22c55e" }}>🔒</span>}
            </Link>
          );
        })}

        {/* AI Chat button */}
        {tryFree ? (
          // Demo mode - AI Chat redirects to login
          <Link href="/login" title={collapsed ? "AI Chat" : undefined}
            style={{
              marginTop: 8, background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 9, padding: collapsed ? "10px 0" : "9px 12px",
              display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
              gap: 10, fontSize: 13, fontWeight: 400, textDecoration: "none",
              color: "var(--text-secondary)", opacity: 0.6,
            }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💬</span>
            {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>AI Chat</span>}
            {!collapsed && <span style={{ fontSize: 10, color: "#22c55e" }}>🔒</span>}
          </Link>
        ) : (
          // Normal mode - AI Chat opens panel
          <button onClick={() => setChatOpen(o => !o)} title={collapsed ? "AI Chat" : undefined}
            style={{
              marginTop: 8, background: chatOpen ? "rgba(0,198,224,0.15)" : "var(--bg-hover)",
              border: chatOpen ? "1px solid rgba(0,198,224,0.35)" : "1px solid var(--border)",
              borderRadius: 9, padding: collapsed ? "10px 0" : "9px 12px",
              display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
              gap: 10, fontSize: 13, fontWeight: chatOpen ? 600 : 400, cursor: "pointer", width: "100%",
              color: chatOpen ? "var(--cyan)" : "var(--text-secondary)",
            }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💬</span>
            {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>AI Chat</span>}
            {!collapsed && chatOpen && <div style={{ width: 6, height: 6, background: "var(--cyan)", borderRadius: "50%", flexShrink: 0 }} />}
          </button>
        )}
      </nav>

      {/* User card or Login button */}
      <div style={{ borderTop: "1px solid var(--border)", padding: collapsed ? "12px 0" : "12px 14px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: collapsed ? 0 : 10, flexShrink: 0 }}>
        {tryFree ? (
          // Demo mode - show login button
          collapsed ? (
            <Link href="/login" title="Login" style={{ background: "var(--cyan)", borderRadius: "50%", color: "#000", fontSize: 12, fontWeight: 700, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none" }}>
              🔑
            </Link>
          ) : (
            <Link href="/login" style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ background: "var(--cyan)", borderRadius: "50%", color: "#000", fontSize: 12, fontWeight: 700, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                🔑
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Login</div>
                <div style={{ fontSize: 10, color: "#22c55e" }}>Login to save chat</div>
              </div>
            </Link>
          )
        ) : (
          // Normal mode - show user
          <>
            <div style={{ background: "var(--cyan)", borderRadius: "50%", color: "#000", fontSize: 12, fontWeight: 700, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {me?.name?.[0]?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me?.name || "..."}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me?.role?.replace(/_/g, " ") || ""}</div>
                </div>
                <Link href="/login" title="Sign out" style={{ color: "var(--text-muted)", fontSize: 14, flexShrink: 0 }}>⏏</Link>
              </>
            )}
          </>
        )}
      </div>

      {/* AI Chat panel — anchored to sidebar right edge */}
      {chatOpen && (
        <div style={{
          position: "fixed", left: sideW, bottom: 0, width: 340, height: "72vh", zIndex: 300,
          background: "var(--bg-panel)", border: "1px solid var(--border)",
          borderRadius: "0 12px 12px 0", display: "flex", flexDirection: "column",
          boxShadow: "6px 0 32px #0009", transition: "left 0.2s ease",
        }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cyan)" }}>🤖 CivilOS AI Chat</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Ask about design, structure, cost</div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 2 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: m.role === "user" ? "var(--cyan)" : "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>
                  {m.role === "user" ? (me?.name?.[0]?.toUpperCase() || "U") : "AI"}
                </div>
                <div style={{ maxWidth: "78%", padding: "9px 12px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.role === "user" ? "rgba(0,198,224,0.15)" : "var(--bg-card)", border: `1px solid ${m.role === "user" ? "rgba(0,198,224,0.3)" : "var(--border)"}`, fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6, wordBreak: "break-word" }}>
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>AI</div>
                <div style={{ padding: "9px 14px", borderRadius: "12px 12px 12px 2px", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(n => <div key={n} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-muted)", animation: `bounce 1.2s ${n * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexShrink: 0 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask anything..."
              style={{ flex: 1, background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "var(--text-primary)", outline: "none" }}
              onFocus={e => (e.target.style.borderColor = "var(--cyan)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            <button onClick={sendMessage} disabled={!input.trim() || thinking}
              style={{ background: input.trim() && !thinking ? "var(--cyan)" : "var(--bg-hover)", color: input.trim() && !thinking ? "#000" : "var(--text-muted)", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: input.trim() && !thinking ? "pointer" : "not-allowed" }}>↑</button>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger button (fixed top-left) */}
      <button className="sidebar-hamburger" onClick={() => setMobileOpen(o => !o)}
        style={{ position: "fixed", top: 12, left: 12, zIndex: 400, background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, width: 38, height: 38, display: "none", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}>
        {mobileOpen ? "×" : "☰"}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 350, display: "none" }} />
      )}

      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={{ display: "flex", height: "100%" }}>
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      <div className="sidebar-mobile" style={{
        position: "fixed", top: 0, left: mobileOpen ? 0 : -240, width: 220, height: "100%",
        zIndex: 360, transition: "left 0.25s ease", display: "none",
      }}>
        {sidebarContent}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile { display: block !important; }
          .sidebar-hamburger { display: flex !important; }
          .sidebar-overlay { display: block !important; }
        }
      `}</style>
    </>
  );
}
