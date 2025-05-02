'use server';

import { z } from 'zod';
import { requireUser } from './utils/requireUser';
import { companySchema, jobSchema, jobSeekerSchema } from './utils/zodSchemas';
import { prisma } from './utils/db';
import { redirect } from 'next/navigation';
import arcjet, { detectBot, shield } from './utils/arcjet';
import { request } from '@arcjet/next';
import { stripe } from './utils/stripe';
import { jobListingDurationPricing } from './utils/jobListingDurationPricing';
import { inngest } from './utils/inngest/client';
import { revalidatePath } from 'next/cache';

const aj = arcjet
  .withRule(
    shield({
      // see what it blocks ... docs.arcjet.com/shield/concepts xss, sqli
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
  console.log('Create new job');
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
      user: {
        select: {
          stripeCustomerId: true,
        },
      },
    },
  });

  if (!company?.id) {
    return redirect('/');
  }

  let stripeCustomerId = company.user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email as string,
      name: user.name as string,
    });

    stripeCustomerId = customer.id;

    // update user with stripe customer id
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        stripeCustomerId: customer.id,
      },
    });
  }

  const jobPost = await prisma.jobPost.create({
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
    select: {
      id: true, // after running the create mutation we use select to return just the id for speed
    },
  });

  const pricingTier = jobListingDurationPricing.find(
    tier => tier.days === validateData.listingDuration
  );

  if (!pricingTier) {
    throw new Error('Invalid Listing Duration selected');
  }

  await inngest.send({
    name: 'job/created',
    data: {
      jobId: jobPost.id,
      expirationDays: validateData.listingDuration,
    },
  });

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          product_data: {
            name: `Job Posting - ${pricingTier.days} Days`,
            description: pricingTier.description,
            images: [
              'https://x9drsjtnm9.ufs.sh/f/TjkwWFUlKvR5jWSiF7TDC6fXFpMqV5KTvusxo40PUdwHgSnY',
            ],
          },
          currency: 'USD',
          unit_amount: pricingTier.price * 100, // stripe works with cents 9900 -> 99.00
        },
        quantity: 1,
      },
    ],
    metadata: {
      jobId: jobPost.id,
    },
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/payment/cancel`,
  });

  return redirect(session.url as string);
}

export async function savejobPost(jobId: string) {
  const user = await requireUser();

  const req = await request();

  // protect against XSS and bots
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error('Forbidden');
  }

  await prisma.savedJobPost.create({
    data: {
      jobPostId: jobId,
      userId: user.id as string,
    },
  });

  revalidatePath(`/job/${jobId}`);
}

export async function unSavejobPost(savedJobPostId: string) {
  const user = await requireUser();

  const req = await request();

  // protect against XSS and bots
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error('Forbidden');
  }

  const data = await prisma.savedJobPost.delete({
    where: {
      id: savedJobPostId,
      userId: user.id,
    },
    select: {
      jobPostId: true,
    },
  });

  revalidatePath(`/job/${data.jobPostId}`);
}

export async function editJobPost(
  data: z.infer<typeof jobSchema>,
  jobId: string
) {
  const user = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error('Forbidden');
  }

  const validateData = jobSchema.parse(data);

  await prisma.jobPost.update({
    where: {
      id: jobId,
      Company: {
        userId: user.id,
      },
    },
    data: {
      jobDescription: validateData.jobDescription,
      jobTitle: validateData.jobTitle,
      employmentType: validateData.employmentType,
      location: validateData.location,
      salaryFrom: validateData.salaryFrom,
      salaryTo: validateData.salaryTo,
      listingDuration: validateData.listingDuration, // this does not change
      benefits: validateData.benefits,
    },
  });

  return redirect('/my-jobs');
}

export async function deleteJobPost(jobId: string) {
  const session = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error('Forbiden');
  }

  await prisma.jobPost.delete({
    where: {
      id: jobId,
      Company: {
        userId: session.id,
      },
    },
  });

  // cancel the excution of inngest long running task
  await inngest.send({
    name: 'job/cancel.expiration',
    data: { jobId: jobId },
  });

  return redirect('/my-jobs');
}
