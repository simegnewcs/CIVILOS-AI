import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      stages: {
        orderBy: { stageOrder: "asc" },
        include: {
          assignee: { select: { id: true, name: true, role: true } },
          approvals: {
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true, role: true } } },
          },
          comments: {
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true, role: true } } },
          },
        },
      },
      costEstimate: true,
      aiOutputs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const allowedFields = ["name", "description", "status", "progress", "location", "plotSize"];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) data[key] = body[key];
  }

  const project = await prisma.project.update({
    where: { id },
    data,
  });

  return NextResponse.json({ project });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
