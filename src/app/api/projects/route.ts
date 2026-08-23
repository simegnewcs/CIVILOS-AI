import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StageType, WorkflowMode } from "@prisma/client";

const STAGE_ORDER: StageType[] = [
  "CLIENT_BRIEF",
  "AI_ARCHITECT",
  "HUMAN_ARCHITECT",
  "AI_STRUCTURAL",
  "HUMAN_STRUCTURAL",
  "AI_COST",
  "HUMAN_QS",
  "PM_APPROVAL",
  "FINAL_DELIVERY",
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type") || undefined;

  const projects = await prisma.project.findMany({
    where: {
      ownerId: session.userId,
      ...(status ? { status: status as never } : {}),
      ...(type ? { projectType: type } : {}),
    },
    include: {
      stages: {
        orderBy: { stageOrder: "asc" },
        select: { stageType: true, status: true, stageOrder: true },
      },
      costEstimate: { select: { totalMin: true, totalMax: true, currency: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, clientName, projectType, location, plotSize, mode } =
      await req.json();

    if (!name || !clientName || !projectType) {
      return NextResponse.json(
        { error: "name, clientName, projectType are required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        clientName,
        projectType,
        location: location || null,
        plotSize: plotSize || null,
        mode: (mode as WorkflowMode) || "CERTIFIED",
        ownerId: session.userId,
        stages: {
          create: STAGE_ORDER.map((stageType, idx) => ({
            stageType,
            stageOrder: idx,
            status: idx === 0 ? "PENDING" : "PENDING",
          })),
        },
      },
      include: { stages: true },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[projects POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
