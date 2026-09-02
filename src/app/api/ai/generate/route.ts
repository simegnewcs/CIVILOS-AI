import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMockDesign } from "@/lib/ai-mock";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();
  const { prompt, buildingType, stories, style, plotSize, projectId, tryFree } = body;

  // Allow demo/try-free mode without auth
  const isDemo = !session || tryFree === true;

  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  // Only return mock data if there is no API key configured.
  if (!GEMINI_API_KEY) {
    const result = getMockDesign(buildingType || "Residential", stories || "2", style || "Modern", plotSize || "400m²");
    return NextResponse.json({ result, tokensUsed: 0, mock: true });
  }

  const systemPrompt = `You are an expert architect AI assistant specializing in Ethiopian and East African building design. 
You generate structured building concept designs in JSON format.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Generate 3 distinct building concept options (A, B, C) for the following project:

Project Brief: ${prompt}
Building Type: ${buildingType || "Residential"}
Stories: ${stories || "2"}
Style: ${style || "Modern"}
Plot Size: ${plotSize || "400m²"}
Location Context: Addis Ababa, Ethiopia

Return a JSON object with this exact structure:
{
  "projectSummary": "One paragraph summary of the project",
  "options": [
    {
      "id": "A",
      "label": "Option A",
      "styleTag": "Modern Minimalist",
      "description": "2-3 sentence description",
      "keyFeatures": ["feature 1", "feature 2", "feature 3"],
      "rooms": [
        { "name": "Living Room", "area": 35, "floor": 1 },
        { "name": "Kitchen", "area": 20, "floor": 1 },
        { "name": "Master Bedroom", "area": 25, "floor": 2 },
        { "name": "Bedroom 2", "area": 20, "floor": 2 },
        { "name": "Bathroom", "area": 8, "floor": 1 },
        { "name": "Corridor", "area": 10, "floor": 1 }
      ],
      "estimatedArea": 180,
      "structuralNotes": "Brief structural observation",
      "costRange": { "min": 36000000, "max": 42000000, "currency": "ETB" }
    }
  ],
  "structuralWarnings": ["warning 1 if any"],
  "aiRecommendation": "Which option is recommended and why"
}`;

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.7,
        }
    });

    let rawContent = response.text || "{}";
    
    // Sometimes Gemini wraps JSON in markdown code blocks even with responseMimeType
    rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(rawContent);

    // Skip DB operations in demo/try-free mode or when no valid session
    if (projectId && !isDemo && session) {
      await prisma.aiOutput.create({
        data: {
          projectId,
          stageType: "AI_ARCHITECT",
          modelUsed: "gemini-2.5-flash",
          promptUsed: userPrompt,
          outputJson: rawContent,
        },
      });

      await prisma.workflowStage.updateMany({
        where: { projectId, stageType: "AI_ARCHITECT" },
        data: { status: "AWAITING_HUMAN", aiOutput: rawContent, startedAt: new Date() },
      });
    }

    const tokensUsed = 0; // The SDK doesn't always return token count simply, so we default to 0
    return NextResponse.json({ result, tokensUsed });
  } catch (error: unknown) {
    // ── Graceful quota fallback ──────────────────────────────────────────────
    // When the Gemini free-tier daily quota is exhausted (429 RESOURCE_EXHAUSTED)
    // we fall back to rich mock data so the UI keeps working instead of showing
    // a generic error to the user.
    const isQuotaError =
      (error instanceof Error &&
        (error.message.includes("RESOURCE_EXHAUSTED") ||
          error.message.includes("quota") ||
          (error as { status?: number }).status === 429)) ||
      (typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error as { status: number }).status === 429);

    if (isQuotaError) {
      console.warn("[ai/generate] Gemini quota exhausted — falling back to mock data");
      const result = getMockDesign(
        buildingType || "Residential",
        stories || "2",
        style || "Modern",
        plotSize || "400m²"
      );
      return NextResponse.json({
        result,
        tokensUsed: 0,
        mock: true,
        quotaExceeded: true,
        notice: "Daily AI quota reached. Showing sample design — your quota resets at midnight Pacific time.",
      });
    }

    console.error("[ai/generate]", error);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
