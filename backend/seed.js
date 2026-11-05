const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('astronote2026', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@astronote.music' },
    update: {},
    create: {
      email: 'admin@astronote.music',
      passwordHash,
      nom: 'Administrateur',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin créé avec succès:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });