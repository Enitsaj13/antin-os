import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

config({ path: new URL('../.env', import.meta.url) });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const portfolioBaseUrl = 'https://jastineformentera.netlify.app';

const projects = [
  {
    title: 'StepCast',
    slug: 'stepcast',
    summary:
      'An AI-assisted guide platform for creating and sharing interactive product manuals.',
    description:
      'StepCast is an AI-assisted guide platform for creating and sharing interactive product manuals. As the lead mobile developer, I built the Expo/React Native consumer app for browsing guides, opening QR/link-based flows, and supporting voice-guided playback. I also handled EAS builds, TestFlight, App Store Connect setup, GitHub Actions automation, and supported Next.js creator/admin workflows.',
    techStack: [
      'Expo',
      'React Native',
      'Next.js',
      'GitHub Actions',
      'EAS',
      'TestFlight',
    ],
    repoUrl: null,
    liveUrl: 'https://staging.stepcast.app/',
    imageUrl: `${portfolioBaseUrl}/images/stepcast.png`,
    isPublic: true,
  },
  {
    title: 'ForSure',
    slug: 'forsure',
    summary:
      'A healthcare and insurance intelligence platform with web, admin, and mobile apps.',
    description:
      'ForSure is a healthcare and insurance intelligence platform with web, admin, and mobile apps backed by a secure NestJS API and AWS infrastructure. As the mobile developer, I built and maintained the React Native/Expo app, implemented user-facing features, integrated APIs and authentication flows, handled iOS/Android builds, TestFlights, and supported QA and over-the-air releases.',
    techStack: [
      'React Native',
      'Expo',
      'NestJS',
      'AWS',
      'Authentication',
      'OTA Releases',
    ],
    repoUrl: null,
    liveUrl: null,
    imageUrl: `${portfolioBaseUrl}/images/forsure.png`,
    isPublic: true,
  },
  {
    title: 'GoGira',
    slug: 'gogira',
    summary:
      'An education marketplace and management platform with multi-portal full-stack workflows.',
    description:
      'GoGira is an education marketplace and management platform built with Next.js, React, TypeScript, Tailwind CSS, React Query, Zustand, React Hook Form, Zod, NestJS, and shared packages. As a full-stack developer, I built and maintained workflows across admin, school, partner, students, and affiliate portals, including backend APIs, authentication, business logic, validation, type-safe contracts, integrations, and reporting/export features.',
    techStack: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'React Query',
      'Zustand',
      'React Hook Form',
      'Zod',
      'NestJS',
    ],
    repoUrl: null,
    liveUrl: null,
    imageUrl: `${portfolioBaseUrl}/images/gogira.png`,
    isPublic: true,
  },
  {
    title: 'LUNA Securities',
    slug: 'luna-securities',
    summary:
      'A stock trading platform for Android and iOS maintained as a production React Native app.',
    description:
      'LUNA Securities is a stock trading platform for Android and iOS. As a React Native developer, I helped maintain the production mobile app, build user-facing features, integrate APIs, improve platform stability, and support app releases for a financial technology product.',
    techStack: ['React Native', 'Android', 'iOS', 'API Integration'],
    repoUrl: null,
    liveUrl: 'https://www.lunasecurities.com/#app_features',
    imageUrl: `${portfolioBaseUrl}/images/luna-securities.png`,
    isPublic: true,
  },
  {
    title: 'Admin Panel',
    slug: 'admin-panel',
    summary:
      'An admin portal with dashboard workflows and reusable React components.',
    description:
      'An admin portal project from my Frontend Developer role at TR Digital Services. I built dashboard workflows, reusable React components, and connected UI screens to business data using TypeScript, Redux Toolkit, Sass, and Next.js.',
    techStack: ['React', 'TypeScript', 'Redux Toolkit', 'Sass', 'Next.js'],
    repoUrl: null,
    liveUrl: 'https://adminpanelmydevice.netlify.app',
    imageUrl: `${portfolioBaseUrl}/images/adminpanel.png`,
    isPublic: true,
  },
  {
    title: 'Onion And Garlic Application',
    slug: 'onion-and-garlic-application',
    summary:
      'A college mobile food delivery app concept built with React Native CLI and Firebase.',
    description:
      'Our college project for a mobile food delivery app concept, developed with React Native CLI for iOS and Firebase for backend services.',
    techStack: ['React Native CLI', 'Firebase', 'iOS'],
    repoUrl: null,
    liveUrl: 'https://onionandgarlic.netlify.app',
    imageUrl: `${portfolioBaseUrl}/images/landing.png`,
    isPublic: true,
  },
];

for (const project of projects) {
  await prisma.project.upsert({
    where: { slug: project.slug },
    update: project,
    create: project,
  });
}

console.log(`Seeded ${projects.length} portfolio projects.`);

await prisma.$disconnect();
