"use client";

import { useState, useEffect } from "react";

const workflowSteps = [
  {
    id: "architect",
    icon: "✏️",
    title: "Architect Design",
    description: "AI-powered floor plans & 3D visualization",
    color: "#00c6e0",
  },
  {
    id: "structural",
    icon: "🏗️",
    title: "Structural Analysis",
    description: "Engineering validation & load calculations",
    color: "#1a5cff",
  },
  {
    id: "quantity",
    icon: "💰",
    title: "Cost Estimation",
    description: "AI-generated BOQ & budget planning",
    color: "#a855f7",
  },
  {
    id: "manager",
    icon: "📋",
    title: "Project Management",
    description: "Timeline tracking & team collaboration",
    color: "#22c55e",
  },
  {
    id: "result",
    icon: "🏠",
    title: "Final Delivery",
    description: "Construction ready documentation",
    color: "#f59e0b",
  },
];

export default function ConstructionWorkflowAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((step) => (step + 1) % workflowSteps.length);
          return 0;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "40px",
        overflow: "hidden",
      }}
    >
      {/* Animated background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 198, 224, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 198, 224, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          animation: "gridMove 20s linear infinite",
        }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 4,
            height: 4,
            background: workflowSteps[i % workflowSteps.length].color,
            borderRadius: "50%",
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            opacity: 0.4,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: 48 }}>
        <h2
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
            fontWeight: 700,
            marginBottom: 12,
            background: "linear-gradient(135deg, #00c6e0, #1a5cff, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Build Smarter with AI
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 400 }}>
          From concept to construction — CivilOS streamlines your entire workflow
        </p>
      </div>

      {/* Workflow Steps */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Progress line */}
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 40,
            bottom: 40,
            width: 2,
            background: "var(--border)",
            borderRadius: 1,
          }}
        >
          <div
            style={{
              width: "100%",
              height: `${((activeStep + progress / 100) / (workflowSteps.length - 1)) * 100}%`,
              background: "linear-gradient(180deg, #00c6e0, #1a5cff, #a855f7)",
              borderRadius: 1,
              transition: "height 0.1s linear",
            }}
          />
        </div>

        {workflowSteps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const isNext = index === activeStep + 1;

          return (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                opacity: isActive || isCompleted ? 1 : isNext ? 0.6 : 0.4,
                transform: isActive ? "scale(1.02)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  background: isActive
                    ? `linear-gradient(135deg, ${step.color}22, ${step.color}44)`
                    : isCompleted
                    ? `${step.color}22`
                    : "var(--bg-card)",
                  border: `2px solid ${isActive || isCompleted ? step.color : "var(--border)"}`,
                  boxShadow: isActive
                    ? `0 0 20px ${step.color}40`
                    : "none",
                  transition: "all 0.3s ease",
                  zIndex: 2,
                }}
              >
                {isCompleted ? "✓" : step.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: 8 }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: isActive ? step.color : "var(--text-primary)",
                    marginBottom: 4,
                    transition: "color 0.3s ease",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {step.description}
                </p>

                {/* Progress bar for active step */}
                {isActive && (
                  <div
                    style={{
                      marginTop: 12,
                      height: 3,
                      background: "var(--bg-panel)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${step.color}, ${workflowSteps[(index + 1) % workflowSteps.length].color})`,
                        borderRadius: 2,
                        transition: "width 0.05s linear",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 48,
          display: "flex",
          gap: 40,
        }}
      >
        {[
          { value: "10x", label: "Faster Planning" },
          { value: "40%", label: "Cost Savings" },
          { value: "99%", label: "Accuracy" },
        ].map((stat, i) => (
          <div key={i}>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: workflowSteps[i].color,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(0) translateX(10px); }
          75% { transform: translateY(10px) translateX(5px); }
        }
      `}</style>
    </div>
  );
}
