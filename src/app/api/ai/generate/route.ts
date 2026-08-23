import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMockDesign } from "@/lib/ai-mock";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();
  const { prompt, buildingType, stories, style, plotSize, projectId, tryFree } = body;

  // Allow demo/try-free mode without auth
  const isDemo = !session || tryFree === true;

  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  // Always return mock data for demo/try-free mode if no API key
  if (isDemo || !GEMINI_API_KEY) {
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
      "costRange": { "min": 280000, "max": 320000, "currency": "USD" }
    }
  ],
  "structuralWarnings": ["warning 1 if any"],
  "aiRecommendation": "Which option is recommended and why"
}`;

  try {
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: { text: systemPrompt }
        },
        contents: [
          { parts: [{ text: userPrompt }] }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      console.error("[Gemini error]", err);
      // Fallback to mock if API fails
      const result = getMockDesign(buildingType || "Residential", stories || "2", style || "Modern", plotSize || "400m²");
      return NextResponse.json({ result, tokensUsed: 0, mock: true });
    }

    const geminiData = await geminiRes.json();
    let rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Sometimes Gemini wraps JSON in markdown code blocks even with responseMimeType
    rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(rawContent);

    // Skip DB operations in demo/try-free mode or when no valid session
    if (projectId && !isDemo && session) {
      await prisma.aiOutput.create({
        data: {
          projectId,
          stageType: "AI_ARCHITECT",
          modelUsed: "gemini-1.5-flash",
          promptUsed: userPrompt,
          outputJson: rawContent,
        },
      });

      await prisma.workflowStage.updateMany({
        where: { projectId, stageType: "AI_ARCHITECT" },
        data: { status: "AWAITING_HUMAN", aiOutput: rawContent, startedAt: new Date() },
      });
    }

    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0;
    return NextResponse.json({ result, tokensUsed });
  } catch (error) {
    console.error("[ai/generate]", error);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
