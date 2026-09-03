import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Server-side authentication check
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch all company projects for zero layout shift (Company View)
  const projects = await prisma.project.findMany({
    include: {
      stages: {
        orderBy: { stageOrder: "asc" },
        select: { stageType: true, status: true, stageOrder: true },
      },
      costEstimate: { select: { totalMin: true, totalMax: true, currency: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Prisma returns dates as Date objects, we need to serialize them to pass to Client Component
  const serializedProjects = projects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const userName = session.name?.split(" ")[0] || "User";

  return <DashboardClient initialProjects={serializedProjects as any} userName={userName} />;
}
