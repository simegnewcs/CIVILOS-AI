import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STAGE_ORDER = [
  "CLIENT_BRIEF",
  "AI_ARCHITECT",
  "HUMAN_ARCHITECT",
  "AI_STRUCTURAL",
  "HUMAN_STRUCTURAL",
  "AI_COST",
  "HUMAN_QS",
  "PM_APPROVAL",
  "FINAL_DELIVERY",
] as const;

async function main() {
  console.log("🌱 Seeding CivilOS database...");

  const password = await bcrypt.hash("password123", 12);

  const [architect, engineer, qs, pm, client] = await Promise.all([
    prisma.user.upsert({
      where: { email: "sara@civilos.com" },
      update: {},
      create: { email: "sara@civilos.com", name: "Sara Mekonnen", passwordHash: password, role: "ARCHITECT", firmName: "DEVVOLTZ Engineering" },
    }),
    prisma.user.upsert({
      where: { email: "bekele@civilos.com" },
      update: {},
      create: { email: "bekele@civilos.com", name: "Bekele Assefa", passwordHash: password, role: "STRUCTURAL_ENGINEER", firmName: "DEVVOLTZ Engineering" },
    }),
    prisma.user.upsert({
      where: { email: "ahmed@civilos.com" },
      update: {},
      create: { email: "ahmed@civilos.com", name: "Ahmed Hassan", passwordHash: password, role: "QUANTITY_SURVEYOR", firmName: "DEVVOLTZ Engineering" },
    }),
    prisma.user.upsert({
      where: { email: "tigist@civilos.com" },
      update: {},
      create: { email: "tigist@civilos.com", name: "Tigist Bekele", passwordHash: password, role: "PROJECT_MANAGER", firmName: "DEVVOLTZ Engineering" },
    }),
    prisma.user.upsert({
      where: { email: "client@civilos.com" },
      update: {},
      create: { email: "client@civilos.com", name: "Ato Bekele T.", passwordHash: password, role: "CLIENT" },
    }),
  ]);

  console.log("✅ Users created");

  const villaA = await prisma.project.upsert({
    where: { id: "seed-project-villa-a" },
    update: {},
    create: {
      id: "seed-project-villa-a",
      name: "Villa A – Addis Ababa",
      clientName: "Ato Bekele T.",
      projectType: "Residential",
      location: "Bole, Addis Ababa",
      plotSize: "400m²",
      status: "IN_PROGRESS",
      progress: 55,
      mode: "CERTIFIED",
      ownerId: architect.id,
      stages: {
        create: STAGE_ORDER.map((stageType, idx) => ({
          stageType,
          stageOrder: idx,
          status:
            idx < 3 ? "APPROVED"
            : idx === 3 ? "AWAITING_HUMAN"
            : "PENDING",
          assigneeId:
            idx === 2 ? architect.id
            : idx === 3 || idx === 4 ? engineer.id
            : idx === 5 || idx === 6 ? qs.id
            : idx === 7 ? pm.id
            : null,
          completedAt: idx < 3 ? new Date() : null,
          startedAt: idx <= 3 ? new Date() : null,
        })),
      },
    },
  });

  await prisma.costEstimate.upsert({
    where: { projectId: villaA.id },
    update: {},
    create: {
      projectId: villaA.id,
      foundation: 45000,
      structure: 180000,
      finishes: 95000,
      mep: 70000,
      labour: 133000,
      totalMin: 390000,
      totalMax: 430000,
      currency: "USD",
      dataSource: "Ethiopia Market Q2 2025",
    },
  });

  await prisma.project.upsert({
    where: { id: "seed-project-office-b" },
    update: {},
    create: {
      id: "seed-project-office-b",
      name: "Commercial Office B",
      clientName: "Selam Constructions",
      projectType: "Commercial",
      location: "Kazanchis, Addis Ababa",
      plotSize: "620m²",
      status: "IN_PROGRESS",
      progress: 70,
      mode: "CERTIFIED",
      ownerId: architect.id,
      stages: {
        create: STAGE_ORDER.map((stageType, idx) => ({
          stageType,
          stageOrder: idx,
          status: idx < 5 ? "APPROVED" : idx === 5 ? "AWAITING_HUMAN" : "PENDING",
          assigneeId:
            idx === 2 ? architect.id
            : idx === 3 || idx === 4 ? engineer.id
            : idx === 5 || idx === 6 ? qs.id
            : idx === 7 ? pm.id
            : null,
          completedAt: idx < 5 ? new Date() : null,
          startedAt: idx <= 5 ? new Date() : null,
        })),
      },
    },
  });

  console.log("✅ Projects seeded");
  console.log("\n🔑 Demo login credentials (all use password: password123)");
  console.log("  sara@civilos.com     → Architect");
  console.log("  bekele@civilos.com   → Structural Engineer");
  console.log("  ahmed@civilos.com    → Quantity Surveyor");
  console.log("  tigist@civilos.com   → Project Manager");
  console.log("  client@civilos.com   → Client");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
