import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const { outputJson, stageType } = await req.json();

  if (!outputJson || !stageType) {
    return NextResponse.json({ error: "outputJson and stageType are required" }, { status: 400 });
  }

  try {
    const existing = await prisma.aiOutput.findFirst({
      where: { projectId, stageType },
    });

    if (existing) {
      await prisma.aiOutput.update({
        where: { id: existing.id },
        data: { outputJson },
      });
    } else {
      await prisma.aiOutput.create({
        data: {
          projectId,
          stageType,
          modelUsed: "gemini-2.5-flash",
          promptUsed: "Generated in AI Studio",
          outputJson,
        },
      });
    }

    await prisma.workflowStage.updateMany({
      where: { projectId, stageType },
      data: { status: "APPROVED", aiOutput: outputJson, completedAt: new Date() },
    });

    if (stageType === "AI_GENERATION") {
      await prisma.workflowStage.updateMany({
        where: { projectId, stageType: "PROMPTER_REVIEW" },
        data: { status: "AWAITING_HUMAN", startedAt: new Date() },
      });
    }

    // 📊 Recalculate project progress
    const allStages = await prisma.workflowStage.findMany({ where: { projectId } });
    const done = allStages.filter((s) => s.status === "APPROVED").length;
    const progress = Math.round((done / allStages.length) * 100);
    const allDone = done === allStages.length;

    await prisma.project.update({
      where: { id: projectId },
      data: { progress, status: allDone ? "COMPLETED" : "IN_PROGRESS" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[save-ai-output]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}