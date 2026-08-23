"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/studio");
  }, [router]);
  return (
    <div style={{ background: "var(--bg-base)", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>
      Redirecting to AI Studio...
    </div>
  );
}
