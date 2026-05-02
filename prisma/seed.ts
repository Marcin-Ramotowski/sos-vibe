import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg(
  process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@db:5432/sos_dev'
)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@uni.pl' },
    update: {},
    create: {
      email: 'admin@uni.pl',
      passwordHash: await hash('admin123'),
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'Uczelni',
    },
  })

  const lecturer = await prisma.user.upsert({
    where: { email: 'lecturer@uni.pl' },
    update: {},
    create: {
      email: 'lecturer@uni.pl',
      passwordHash: await hash('lecturer123'),
      role: UserRole.LECTURER,
      firstName: 'Jan',
      lastName: 'Kowalski',
    },
  })

  await prisma.user.upsert({
    where: { email: 'student@uni.pl' },
    update: {},
    create: {
      email: 'student@uni.pl',
      passwordHash: await hash('student123'),
      role: UserRole.STUDENT,
      firstName: 'Anna',
      lastName: 'Nowak',
    },
  })

  await prisma.course.upsert({
    where: { id: 'seed-course-1' },
    update: {},
    create: {
      id: 'seed-course-1',
      name: 'Algebra Liniowa',
      description: 'Podstawy algebry liniowej: wektory, macierze, układy równań',
      capacity: 30,
      lecturerId: lecturer.id,
    },
  })

  await prisma.course.upsert({
    where: { id: 'seed-course-2' },
    update: {},
    create: {
      id: 'seed-course-2',
      name: 'Analiza Matematyczna',
      description: 'Rachunek różniczkowy i całkowy',
      capacity: 25,
      lecturerId: lecturer.id,
    },
  })

  await prisma.course.upsert({
    where: { id: 'seed-course-3' },
    update: {},
    create: {
      id: 'seed-course-3',
      name: 'Wprowadzenie do Programowania',
      description: 'Podstawy programowania w Python',
      capacity: 2,
    },
  })

  console.log('Seed completed:', { admin: admin.email, lecturer: lecturer.email })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
