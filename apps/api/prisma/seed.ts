import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

import { auth } from '../src/auth';

const prisma = new PrismaClient();

const STAFF_EMAIL = 'owner@demo.nexa';
const STAFF_PASSWORD = 'ownerpass123';

// Seeds one demo restaurant with its queues and a staff admin, so the vertical
// slice (join -> reception board) and staff auth have something to run against.
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

  // Staff admin via BetterAuth. Role is not settable at sign-up, so set it after.
  const existing = await prisma.user.findUnique({ where: { email: STAFF_EMAIL } });
  if (!existing) {
    await auth.api.signUpEmail({
      body: { email: STAFF_EMAIL, password: STAFF_PASSWORD, name: 'Dueño Demo' },
    });
  }
  await prisma.user.update({ where: { email: STAFF_EMAIL }, data: { role: 'admin' } });
  console.log(`Seeded staff admin ${STAFF_EMAIL} (password: ${STAFF_PASSWORD})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
