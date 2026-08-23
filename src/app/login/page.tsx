"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConstructionWorkflowAnimation from "@/components/ConstructionWorkflowAnimation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }} className="flex">
      {/* Left Side - Construction Animation */}
      <div
        className="flex"
        style={{
          flex: 1,
          borderRight: "1px solid var(--border)",
          background: "linear-gradient(135deg, rgba(0,198,224,0.03) 0%, rgba(26,92,255,0.03) 50%, rgba(168,85,247,0.03) 100%)",
          minWidth: 0,
        }}
      >
        <ConstructionWorkflowAnimation />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10" style={{ minWidth: 360 }}>
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(0,198,224,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(26,92,255,0.05) 0%, transparent 50%)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div style={{ background: "var(--cyan)", borderRadius: 10 }} className="w-10 h-10 flex items-center justify-center font-bold text-black text-lg">C</div>
          <div>
            <div className="font-bold text-xl tracking-tight">CivilOS<span style={{ color: "var(--cyan)" }}>AI</span></div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Construction Workflow OS</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 }} className="p-8">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@firm.com"
                required
                style={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  borderRadius: 10,
                  outline: "none",
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 14,
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  borderRadius: 10,
                  outline: "none",
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 14,
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#ef444422", border: "1px solid #ef444466", color: "#ef4444", borderRadius: 9, padding: "10px 12px", fontSize: 13 }}>
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: isLoading ? "var(--cyan-dim)" : "var(--cyan)",
                color: "#000",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontSize: 15,
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                marginTop: 4,
              }}
            >
              {isLoading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "var(--cyan)" }} className="font-semibold hover:opacity-80">
              Create one
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          <Link href="/" className="hover:text-white transition-colors">← Back to homepage</Link>
        </div>
      </div>
      </div>
    </div>
  );
}
