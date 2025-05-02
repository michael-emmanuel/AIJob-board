import { prisma } from '@/app/utils/db';
import { requireUser } from '@/app/utils/requireUser';
import { EditJobForm } from '@/components/forms/EditJobForm';
import { notFound } from 'next/navigation';

// bc this code lives in a dynamic folder, we can grab the jobId
async function getData(jobId: string, userId: string) {
  const data = await prisma.jobPost.findUnique({
    where: {
      id: jobId,
      Company: {
        userId: userId,
      },
    },
    select: {
      benefits: true,
      id: true,
      jobTitle: true,
      jobDescription: true,
      salaryFrom: true,
      salaryTo: true,
      location: true,
      employmentType: true,
      listingDuration: true,
      Company: {
        select: {
          about: true,
          name: true,
          location: true,
          website: true,
          xAccount: true,
          logo: true,
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

type Params = Promise<{ jobId: string }>; // jobId comes from folder name, make sure spelt the same

export default async function EditJob({ params }: { params: Params }) {
  const { jobId } = await params;
  const user = await requireUser();
  const data = await getData(jobId, user.id as string);

  return <EditJobForm jobPost={data} />;
}
