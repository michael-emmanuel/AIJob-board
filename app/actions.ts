'use server';

import { z } from 'zod';
import { requireUser } from './utils/requireUser';
import { companySchema, jobSchema, jobSeekerSchema } from './utils/zodSchemas';
import { prisma } from './utils/db';
import { redirect } from 'next/navigation';
import arcjet, { detectBot, shield } from './utils/arcjet';
import { request } from '@arcjet/next';

const aj = arcjet
  .withRule(
    shield({
      // see what it blocks ... docs.arcjet.com/shield/concepts
      mode: 'LIVE',
    })
  )
  .withRule(
    detectBot({
      mode: 'LIVE',
      allow: [], // allow google seo, etc
    })
  );
// By default a server action creates a public HTTP endpoint
export async function createCompany(data: z.infer<typeof companySchema>) {
  const session = await requireUser();
  // begin arcjet security...
  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error('Forbidden');
  }
  // end arcjet security
  const validateData = companySchema.parse(data);

  await prisma.user.update({
    where: {
      id: session.id,
    },
    data: {
      onboardingCompleted: true,
      userType: 'COMPANY',
      Company: {
        create: {
          ...validateData,
        },
      },
    },
  });

  return redirect('/');
}

export async function createJobSeeker(data: z.infer<typeof jobSeekerSchema>) {
  const user = await requireUser();
  // begin arcjet security...
  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error('Forbidden');
  }
  // end arcjet security...
  const validateData = jobSeekerSchema.parse(data);

  await prisma.user.update({
    where: {
      id: user.id as string,
    },
    data: {
      onboardingCompleted: true,
      userType: 'JOB_SEEKER',
      JobSeeker: {
        create: {
          ...validateData, // spread syntax only works if zod & prisma schema are same
        },
      },
    },
  });

  return redirect('/');
}

export async function createJob(data: z.infer<typeof jobSchema>) {
  const user = await requireUser();
  // begin arcjet security...
  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error('Forbidden');
  }
  // end arcjet security
  const validateData = jobSchema.parse(data);

  const company = await prisma.company.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!company?.id) {
    return redirect('/');
  }

  await prisma.jobPost.create({
    data: {
      jobDescription: validateData.jobDescription,
      jobTitle: validateData.jobTitle,
      employmentType: validateData.employmentType,
      location: validateData.location,
      salaryFrom: validateData.salaryFrom,
      salaryTo: validateData.salaryTo,
      listingDuration: validateData.listingDuration,
      benefits: validateData.benefits,
      companyId: company.id,
    },
  });

  return redirect('/');
}
