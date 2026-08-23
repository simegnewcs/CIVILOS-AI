import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { body, stageId } = await req.json();

  if (!body?.trim()) {
    return NextResponse.json({ error: "Comment body required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      projectId,
      stageId: stageId || null,
      userId: session.userId,
      body,
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
