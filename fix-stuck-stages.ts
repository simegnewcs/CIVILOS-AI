import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stages = await prisma.workflowStage.findMany({
    orderBy: { stageOrder: 'asc' }
  });
  
  let fixedCount = 0;
  for (let i = 1; i < stages.length; i++) {
    if (stages[i].status === 'PENDING' && stages[i-1].status === 'APPROVED' && stages[i].projectId === stages[i-1].projectId) {
      await prisma.workflowStage.update({
        where: { id: stages[i].id },
        data: { status: 'AWAITING_HUMAN', startedAt: new Date() }
      });
      console.log(`Fixed stage ${stages[i].stageType} for project ${stages[i].projectId}`);
      fixedCount++;
    }
  }
  console.log(`Fixed ${fixedCount} stuck stages.`);
}

main().finally(() => prisma.$disconnect());
