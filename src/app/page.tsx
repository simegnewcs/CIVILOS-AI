import Link from "next/link";

const features = [
  {
    icon: "🤖",
    title: "AI Architect Engine",
    desc: "Generates building layouts and concept options A/B/C automatically.",
  },
  {
    icon: "🏗️",
    title: "Structural Reasoner",
    desc: "Evaluates stability rules, flags risks before human review.",
  },
  {
    icon: "💰",
    title: "AI Cost Estimator",
    desc: "Predicts material + labor cost, produces BOQ-style output instantly.",
  },
  {
    icon: "⚙️",
    title: "Workflow Orchestrator",
    desc: "Controls role transitions, manages approvals, enforces step logic.",
  },
  {
    icon: "👷",
    title: "Human Validation Layer",
    desc: "Every stage requires certified professional review and sign-off.",
  },
  {
    icon: "📋",
    title: "Audit Trail",
    desc: "Full timeline, comments, and legal-grade approval documentation.",
  },
];

const flow = [
  "Client Idea",
  "AI Draft",
  "Architect Review",
  "Structural Analysis",
  "Engineer Review",
  "Cost Estimation",
  "QS Review",
  "PM Approval",
  "Final Delivery",
];

const roles = [
  { role: "Architect", color: "#00c6e0", desc: "Reviews AI designs, edits layouts, approves concept stage" },
  { role: "Structural Engineer", color: "#1a5cff", desc: "Validates structural safety, checks feasibility" },
  { role: "Quantity Surveyor", color: "#a855f7", desc: "Estimates cost, validates material usage" },
  { role: "Project Manager", color: "#22c55e", desc: "Final approval, coordination control, delivery" },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-base)", color: "var(--text-primary)", minHeight: "100vh" }}>
      {/* Background Video */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/Blog%20Video.mp4"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
            filter: "contrast(1.2) saturate(1.3)",
          }}
        >
          <source src="/Blog%20Video.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for better text readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, var(--bg-base) 0%, transparent 30%, transparent 70%, var(--bg-base) 100%)",
          }}
        />
      </div>

      {/* NAV */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "rgba(11,15,26,0.8)", backdropFilter: "blur(10px)", position: "relative", zIndex: 10 }}
        className="flex items-center justify-between px-8 py-4 sticky top-0">
        <div className="flex items-center gap-3">
          <div style={{ background: "var(--cyan)", borderRadius: 8 }} className="w-8 h-8 flex items-center justify-center font-bold text-sm text-black">C</div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>CivilOS <span style={{ color: "var(--cyan)" }}>AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "var(--text-secondary)" }}>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
          <a href="#roles" className="hover:text-white transition-colors">Roles</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" style={{ color: "var(--text-secondary)" }} className="text-sm hover:text-white transition-colors px-4 py-2">Log in</Link>
          <Link href="/signup" style={{ background: "var(--cyan)", color: "#000" }} className="text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20" style={{ position: "relative", zIndex: 10 }}>
        <div style={{ background: "rgba(0,198,224,0.1)", border: "1px solid rgba(0,198,224,0.3)", color: "var(--cyan)" }}
          className="text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
          AI + Human Construction OS
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight max-w-4xl mb-6">
          The Operating System for<br />
          <span style={{ color: "var(--cyan)" }}>Modern Construction</span>
        </h1>
        <p className="text-lg max-w-2xl mb-10" style={{ color: "var(--text-secondary)" }}>
          Connect AI systems with real professionals through a structured workflow — from client idea to approved design, with full audit trail and role-based validation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap justify-center">
          <Link href="/studio?tryFree=1" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
            className="font-bold px-8 py-3 rounded-xl text-base hover:opacity-90 transition-all shadow-lg">
            ⚡ Try Free CivilOS
          </Link>
        </div>

        {/* Flow strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-2 max-w-3xl">
          {flow.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: i % 2 === 0 ? "var(--cyan)" : "var(--text-secondary)" }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap">
                {step}
              </div>
              {i < flow.length - 1 && <span style={{ color: "var(--text-muted)" }} className="text-xs">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-20 max-w-6xl mx-auto" style={{ position: "relative", zIndex: 10 }}>
        <h2 className="text-3xl font-bold text-center mb-3">AI System Components</h2>
        <p className="text-center mb-12" style={{ color: "var(--text-secondary)" }}>Multi-model AI architecture — not one model, but specialized engines</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              className="rounded-xl p-6 hover:border-cyan-500 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" style={{ background: "var(--bg-panel)", position: "relative", zIndex: 10 }} className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Role-Based System</h2>
          <p className="text-center mb-12" style={{ color: "var(--text-secondary)" }}>Each professional has a dedicated AI + human interaction layer</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roles.map((r) => (
              <div key={r.role} style={{ background: "var(--bg-card)", border: `1px solid ${r.color}33` }}
                className="rounded-xl p-6 flex gap-4 items-start">
                <div style={{ background: r.color + "22", border: `1px solid ${r.color}55`, color: r.color }}
                  className="text-xs font-bold px-3 py-1 rounded-lg whitespace-nowrap mt-0.5">{r.role}</div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-20 max-w-5xl mx-auto" style={{ position: "relative", zIndex: 10 }}>
        <h2 className="text-3xl font-bold text-center mb-3">Simple Pricing</h2>
        <p className="text-center mb-12" style={{ color: "var(--text-secondary)" }}>Start free, scale as your firm grows</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { plan: "Small Firm", price: "ETB 3,500-11,000", period: "/month", features: ["Up to 5 projects", "AI drafting tools", "Basic collaboration"] },
            { plan: "Medium Firm", price: "ETB 23,000-58,000", period: "/month", features: ["Unlimited projects", "Full AI suite", "Client portal", "API access", "10 role seats", "Full audit trail", "Priority support"], highlight: true },
            { plan: "Enterprise", price: "Custom", period: "", features: ["Unlimited everything", "Custom AI training", "API access", "Dedicated support", "SLA guarantee"] },
          ].map((p) => (
            <div key={p.plan}
              style={{
                background: p.highlight ? "linear-gradient(135deg, var(--blue-dim), var(--bg-card))" : "var(--bg-card)",
                border: p.highlight ? "1px solid var(--cyan)" : "1px solid var(--border)"
              }}
              className="rounded-xl p-6 flex flex-col">
              {p.highlight && <div style={{ color: "var(--cyan)", background: "rgba(0,198,224,0.1)", border: "1px solid rgba(0,198,224,0.3)" }} className="text-xs font-bold px-2 py-0.5 rounded-full self-start mb-3">POPULAR</div>}
              <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>{p.plan}</div>
              <div className="text-3xl font-bold mb-4">{p.price}<span className="text-base font-normal" style={{ color: "var(--text-secondary)" }}>{p.period}</span></div>
              <ul className="flex flex-col gap-2 flex-1 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--green)" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ background: p.highlight ? "var(--cyan)" : "var(--bg-hover)", color: p.highlight ? "#000" : "var(--text-primary)", border: p.highlight ? "none" : "1px solid var(--border)" }}
                className="text-center font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg-panel)", position: "relative", zIndex: 10 }} className="px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div style={{ background: "var(--cyan)", borderRadius: 6 }} className="w-6 h-6 flex items-center justify-center font-bold text-xs text-black">C</div>
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>CivilOS AI</span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>developed by DevVoltz company</p>
        <div className="flex gap-6 text-sm" style={{ color: "var(--text-muted)" }}>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
