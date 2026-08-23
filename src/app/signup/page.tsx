"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConstructionWorkflowAnimation from "@/components/ConstructionWorkflowAnimation";

const DEFAULT_ROLE = "CLIENT";

const roleInfo = { id: "CLIENT", label: "Client", color: "#f59e0b", icon: "👤" };

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firmName, setFirmName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [selectedRole] = useState(DEFAULT_ROLE);

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError("");
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: selectedRole, firmName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
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

  // Role is auto-assigned as CLIENT, admin can change it later

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

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10" style={{ minWidth: 360 }}>
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(0,198,224,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(26,92,255,0.05) 0%, transparent 50%)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div style={{ background: "var(--cyan)", borderRadius: 10 }} className="w-10 h-10 flex items-center justify-center font-bold text-black text-lg">C</div>
          <div>
            <div className="font-bold text-xl tracking-tight">CivilOS<span style={{ color: "var(--cyan)" }}>AI</span></div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Construction Workflow OS</div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div style={{
                width: 28, height: 28, borderRadius: "50%", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: step >= s ? "var(--cyan)" : "var(--bg-card)",
                color: step >= s ? "#000" : "var(--text-muted)",
                border: step >= s ? "none" : "1px solid var(--border)",
              }}>
                {step > s ? "✓" : s}
              </div>
              <span style={{ fontSize: 12, color: step >= s ? "var(--text-primary)" : "var(--text-muted)", fontWeight: step === s ? 600 : 400 }}>
                {s === 1 ? "Account Setup" : "Profile Info"}
              </span>
              {s < 2 && <span style={{ color: "var(--border)", marginLeft: 4 }}>—</span>}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 }} className="p-8">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold mb-1">Create your account</h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Set a password to secure your account</p>

              <form onSubmit={handleStep1} className="flex flex-col gap-5">
                {/* Password */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Password *</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" required
                    style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Confirm Password *</label>
                  <input
                    type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password" required
                    style={{
                      width: "100%", background: "var(--bg-panel)", outline: "none",
                      border: confirm && confirm !== password ? "1px solid #ef4444" : "1px solid var(--border)",
                      color: "var(--text-primary)", borderRadius: 10, padding: "10px 14px", fontSize: 14,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = confirm !== password ? "#ef4444" : "var(--cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = confirm && confirm !== password ? "#ef4444" : "var(--border)")}
                  />
                  {confirm && confirm !== password && (
                    <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>Passwords do not match</p>
                  )}
                </div>

                {error && (
                  <div style={{ background: "#ef444422", border: "1px solid #ef444466", color: "#ef4444", borderRadius: 9, padding: "10px 12px", fontSize: 13 }}>
                    ⚠ {error}
                  </div>
                )}

                <button type="submit"
                  style={{ background: "var(--cyan)", color: "#000", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  Continue →
                </button>
              </form>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep(1)} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 7, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
                  ← Back
                </button>
               
              </div>

              <h1 className="text-2xl font-bold mb-1">Your profile</h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Tell us about yourself</p>

              <form onSubmit={handleStep2} className="flex flex-col gap-5">
                {/* Full name */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Full Name *</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Sara Mekonnen" required
                    style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Work Email *</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@firm.com" required
                    style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>

                {/* Firm name */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    Firm / Company Name <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="text" value={firmName} onChange={(e) => setFirmName(e.target.value)}
                    placeholder="DEVVOLTZ Engineering"
                    style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>

                {/* Terms */}
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  By creating an account you agree to our{" "}
                  <span style={{ color: "var(--cyan)" }}>Terms of Service</span> and{" "}
                  <span style={{ color: "var(--cyan)" }}>Privacy Policy</span>.
                </p>

                {error && (
                  <div style={{ background: "#ef444422", border: "1px solid #ef444466", color: "#ef4444", borderRadius: 9, padding: "10px 12px", fontSize: 13 }}>
                    ⚠ {error}
                  </div>
                )}

                <button type="submit" disabled={isLoading}
                  style={{ background: isLoading ? "var(--cyan-dim)" : "var(--cyan)", color: "#000", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer" }}>
                  {isLoading ? "Creating account..." : "Create Account →"}
                </button>
              </form>
            </>
          )}

          <div className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--cyan)" }} className="font-semibold hover:opacity-80">
              Sign in
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
