import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StageStatus } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const stages = await prisma.workflowStage.findMany({
    where: { projectId: id },
    orderBy: { stageOrder: "asc" },
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      approvals: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  return NextResponse.json({ stages });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { stageId, status, aiOutput, humanNotes, assigneeId } = await req.json();

  if (!stageId) {
    return NextResponse.json({ error: "stageId required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (status) {
    updateData.status = status as StageStatus;
    if (status === "AI_RUNNING" || status === "AWAITING_HUMAN") {
      updateData.startedAt = new Date();
    }
    if (status === "APPROVED" || status === "REJECTED") {
      updateData.completedAt = new Date();
    }
  }
  if (aiOutput !== undefined) updateData.aiOutput = aiOutput;
  if (humanNotes !== undefined) updateData.humanNotes = humanNotes;
  if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

  const stage = await prisma.workflowStage.update({
    where: { id: stageId },
    data: updateData,
  });

  await recalcProjectProgress(id);

  return NextResponse.json({ stage });
}

async function recalcProjectProgress(projectId: string) {
  const stages = await prisma.workflowStage.findMany({
    where: { projectId },
    select: { status: true },
  });
  const done = stages.filter(
    (s) => s.status === "APPROVED" || s.status === "SKIPPED"
  ).length;
  const progress = Math.round((done / stages.length) * 100);

  const allDone = stages.every(
    (s) => s.status === "APPROVED" || s.status === "SKIPPED"
  );

  await prisma.project.update({
    where: { id: projectId },
    data: {
      progress,
      status: allDone ? "COMPLETED" : "IN_PROGRESS",
    },
  });
}
