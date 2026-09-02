import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMockCost } from "@/lib/ai-mock";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, totalArea, buildingType, stories, location, selectedOption } = await req.json();

  if (!OPENAI_API_KEY) {
    const result = getMockCost(totalArea || 200, buildingType || "Residential");
    return NextResponse.json({ result, mock: true });
  }

  const userPrompt = `Generate a detailed construction cost estimate (BOQ) for this project:

Building Type: ${buildingType || "Residential"}
Total Floor Area: ${totalArea || 200}m²
Stories: ${stories || 2}
Location: ${location || "Addis Ababa, Ethiopia"}
Selected Design: ${selectedOption || "Option A"}

Use current Addis Ababa, Ethiopia construction market rates (Q2 2025).
Labour rates: Ethiopian standard.

Return JSON only with this structure:
{
  "boq": [
    { "category": "Site Preparation", "description": "Excavation and leveling", "unit": "m²", "qty": 200, "unitRate": 45, "total": 9000 },
    { "category": "Foundation", "description": "Strip foundation, concrete C25", "unit": "m³", "qty": 48, "unitRate": 320, "total": 15360 },
    { "category": "Structural Frame", "description": "RC columns and beams", "unit": "m³", "qty": 85, "unitRate": 480, "total": 40800 },
    { "category": "Masonry", "description": "Block walls 20cm", "unit": "m²", "qty": 320, "unitRate": 85, "total": 27200 },
    { "category": "Roof", "description": "EGA sheet roofing with timber frame", "unit": "m²", "qty": 210, "unitRate": 120, "total": 25200 },
    { "category": "Plastering", "description": "Internal and external plaster", "unit": "m²", "qty": 640, "unitRate": 35, "total": 22400 },
    { "category": "Flooring", "description": "Ceramic floor tiles", "unit": "m²", "qty": 200, "unitRate": 65, "total": 13000 },
    { "category": "Doors & Windows", "description": "Aluminium frames with glass", "unit": "pcs", "qty": 18, "unitRate": 850, "total": 15300 },
    { "category": "Electrical", "description": "Complete electrical installation", "unit": "LS", "qty": 1, "unitRate": 22000, "total": 22000 },
    { "category": "Plumbing", "description": "Water supply and drainage", "unit": "LS", "qty": 1, "unitRate": 18000, "total": 18000 },
    { "category": "Painting", "description": "Interior and exterior painting", "unit": "m²", "qty": 640, "unitRate": 18, "total": 11520 }
  ],
  "summary": {
    "materialCost": 185000,
    "labourCost": 62000,
    "overheadContingency": 18000,
    "totalMin": 245000,
    "totalMax": 280000,
    "currency": "ETB",
    "pricePerSqm": 1225
  },
  "notes": "Key cost assumptions and market notes",
  "riskFlags": ["potential cost risks"]
}`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a quantity surveyor AI specializing in Ethiopian construction costs. Return valid JSON only." },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json();
      const isQuota = err.error?.code === "insufficient_quota" || openaiRes.status === 429;
      if (isQuota) {
        const result = getMockCost(totalArea || 200, buildingType || "Residential");
        return NextResponse.json({ result, mock: true });
      }
      return NextResponse.json({ error: err.error?.message || "OpenAI error" }, { status: 502 });
    }

    const openaiData = await openaiRes.json();
    const rawContent = openaiData.choices[0]?.message?.content || "{}";
    const result = JSON.parse(rawContent);

    if (projectId && result.summary) {
      await prisma.costEstimate.upsert({
        where: { projectId },
        update: {
          foundation: result.boq?.find((b: { category: string }) => b.category === "Foundation")?.total,
          structure: result.boq?.find((b: { category: string }) => b.category === "Structural Frame")?.total,
          finishes: result.summary.materialCost,
          mep: (result.boq?.find((b: { category: string }) => b.category === "Electrical")?.total || 0) +
               (result.boq?.find((b: { category: string }) => b.category === "Plumbing")?.total || 0),
          labour: result.summary.labourCost,
          totalMin: result.summary.totalMin,
          totalMax: result.summary.totalMax,
          currency: result.summary.currency || "ETB",
          dataSource: "OpenAI GPT-4o + Ethiopia Market Q2 2025",
        },
        create: {
          projectId,
          foundation: result.boq?.find((b: { category: string }) => b.category === "Foundation")?.total,
          structure: result.boq?.find((b: { category: string }) => b.category === "Structural Frame")?.total,
          finishes: result.summary.materialCost,
          mep: (result.boq?.find((b: { category: string }) => b.category === "Electrical")?.total || 0) +
               (result.boq?.find((b: { category: string }) => b.category === "Plumbing")?.total || 0),
          labour: result.summary.labourCost,
          totalMin: result.summary.totalMin,
          totalMax: result.summary.totalMax,
          currency: result.summary.currency || "ETB",
          dataSource: "OpenAI GPT-4o + Ethiopia Market Q2 2025",
        },
      });

      await prisma.workflowStage.updateMany({
        where: { projectId, stageType: "AI_COST" },
        data: { status: "AWAITING_HUMAN", aiOutput: rawContent, startedAt: new Date() },
      });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[ai/cost]", error);
    return NextResponse.json({ error: "Cost estimation failed" }, { status: 500 });
  }
}
