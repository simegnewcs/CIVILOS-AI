import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { stageId, decision, signature, notes } = await req.json();

  if (!stageId || !decision || !signature) {
    return NextResponse.json(
      { error: "stageId, decision, and signature are required" },
      { status: 400 }
    );
  }

  if (!["approved", "rejected", "sent_back"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision value" }, { status: 400 });
  }

  const approval = await prisma.approval.create({
    data: {
      stageId,
      userId: session.userId,
      decision,
      signature,
      notes: notes || null,
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  const newStatus =
    decision === "approved"
      ? "APPROVED"
      : decision === "rejected"
      ? "REJECTED"
      : "PENDING";

  await prisma.workflowStage.update({
    where: { id: stageId },
    data: {
      status: newStatus,
      completedAt: decision !== "sent_back" ? new Date() : null,
      humanNotes: notes || undefined,
    },
  });

  if (decision === "approved") {
    const stages = await prisma.workflowStage.findMany({
      where: { projectId },
      orderBy: { stageOrder: "asc" },
    });

    const currentIdx = stages.findIndex((s) => s.id === stageId);
    if (currentIdx !== -1 && currentIdx + 1 < stages.length) {
      await prisma.workflowStage.update({
        where: { id: stages[currentIdx + 1].id },
        data: { status: "PENDING" },
      });
    }

    const done = stages.filter((s, i) =>
      i <= currentIdx ? true : s.status === "APPROVED"
    ).length;
    const progress = Math.round((done / stages.length) * 100);
    const allDone = done === stages.length;

    await prisma.project.update({
      where: { id: projectId },
      data: { progress, status: allDone ? "COMPLETED" : "IN_PROGRESS" },
    });
  }

  return NextResponse.json({ approval });
}
