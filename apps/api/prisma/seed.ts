import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seeds one demo restaurant with its queues and an owner, so the phase-2
// vertical slice (join -> reception board) has something to run against.
async function main(): Promise<void> {
  const restaurant = await prisma.restaurant.upsert({
    where: { code: 'DEMO' },
    update: {},
    create: {
      name: 'Bistro Moderno',
      code: 'DEMO',
      qrToken: 'demo-qr-token',
      etaBaseMinutes: 10,
      expirationMinutes: 10,
      plan: 'free',
      queues: {
        create: [
          { name: 'General', priority: 0 },
          { name: 'VIP', priority: 1 },
          { name: 'Visitante', priority: 2 },
        ],
      },
    },
    include: { queues: true },
  });

  console.log(
    `Seeded restaurant "${restaurant.name}" (code ${restaurant.code}) with ${restaurant.queues.length} queues`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
