import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await req.json();
  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { aiOutputs: { where: { stageType: "AI_ARCHITECT" } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const aiOutput = project.aiOutputs[0];
    if (!aiOutput) {
      return NextResponse.json({ error: "AI Architect output not found" }, { status: 400 });
    }

    let parsedJson: any = {};
    try {
      parsedJson = JSON.parse(aiOutput.outputJson);
    } catch {
      return NextResponse.json({ error: "Invalid AI Output JSON" }, { status: 500 });
    }

    // Return existing image if already generated
    if (parsedJson.floorPlanImage) {
      return NextResponse.json({ imageBase64: parsedJson.floorPlanImage });
    }

    // Generate new image using Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const prompt = `A stunning, hyper-realistic photorealistic 3D exterior render of a modern ${project.projectType} house. Architectural photography, daylight, beautiful landscaping, high resolution, 8k, octane render. Location context: Addis Ababa, Ethiopia. Size: ${project.plotSize || 'Medium'}.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
    
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("[Gemini Image API Error]", err);
      return NextResponse.json({ error: "Failed to generate image from Gemini API" }, { status: 502 });
    }

    const data = await geminiRes.json();
    const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;

    if (!imageBase64) {
      return NextResponse.json({ error: "No image data returned from Gemini" }, { status: 502 });
    }

    // Save back to DB
    parsedJson.floorPlanImage = imageBase64;
    await prisma.aiOutput.update({
      where: { id: aiOutput.id },
      data: { outputJson: JSON.stringify(parsedJson) },
    });

    return NextResponse.json({ imageBase64 });
  } catch (error) {
    console.error("[generate-floorplan error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
