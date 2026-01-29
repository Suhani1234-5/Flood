const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@floodguard.example' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@floodguard.example',
      passwordHash: '$2a$10$placeholder',
      telegramChatId: null,
    },
  });
  const user2 = await prisma.user.upsert({
    where: { email: 'bob@floodguard.example' },
    update: {},
    create: {
      name: 'Bob',
      email: 'bob@floodguard.example',
      passwordHash: '$2a$10$placeholder',
      telegramChatId: '123456789',
    },
  });

  // Create sample locations
  const loc1 = await prisma.location.upsert({
    where: { name_region: { name: 'Downtown Riverfront', region: 'City Center' } },
    update: {},
    create: {
      name: 'Downtown Riverfront',
      region: 'City Center',
      latitude: 12.9716,
      longitude: 77.5946,
    },
  });
  const loc2 = await prisma.location.upsert({
    where: { name_region: { name: 'North Reservoir', region: 'North District' } },
    update: {},
    create: {
      name: 'North Reservoir',
      region: 'North District',
      latitude: 13.0827,
      longitude: 80.2707,
    },
  });

  // Subscribe users to locations
  await prisma.userLocationSubscription.upsert({
    where: {
      userId_locationId: { userId: user1.id, locationId: loc1.id },
    },
    update: {},
    create: { userId: user1.id, locationId: loc1.id },
  });
  await prisma.userLocationSubscription.upsert({
    where: {
      userId_locationId: { userId: user2.id, locationId: loc1.id },
    },
    update: {},
    create: { userId: user2.id, locationId: loc1.id },
  });
  await prisma.userLocationSubscription.upsert({
    where: {
      userId_locationId: { userId: user2.id, locationId: loc2.id },
    },
    update: {},
    create: { userId: user2.id, locationId: loc2.id },
  });

  // Create sample alerts
  await prisma.alert.createMany({
    data: [
      { locationId: loc1.id, severity: 'MEDIUM', message: 'Water level rising. Monitor closely.' },
      { locationId: loc1.id, severity: 'HIGH', message: 'Flood warning issued. Evacuate if advised.' },
      { locationId: loc2.id, severity: 'LOW', message: 'Minor water accumulation. No immediate risk.' },
    ],
  });

  // Create sample flood readings
  const baseDate = new Date();
  await prisma.floodReading.createMany({
    data: [
      { locationId: loc1.id, waterLevelCm: 45, recordedAt: new Date(baseDate.getTime() - 3600000) },
      { locationId: loc1.id, waterLevelCm: 78, recordedAt: baseDate },
      { locationId: loc2.id, waterLevelCm: 12, recordedAt: baseDate },
    ],
  });

  console.log('Seed completed: users, locations, subscriptions, alerts, flood readings created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
