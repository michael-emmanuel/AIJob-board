import { prisma } from '@/app/utils/db';
import { EmptyState } from './EmptyState';
import { JobCard } from './JobCard';
import { MainPagination } from './MainPagination';
import { JobPostStatus } from '@prisma/client';

// pageSize - number of listings to show per page
async function getData({
  page = 1,
  pageSize = 2,
  jobTypes = [],
  location = '',
}: {
  page: number;
  pageSize: number;
  jobTypes: string[];
  location: string;
}) {
  const skip = (page - 1) * pageSize;

  // only get active job posts, if we have job types selected return only res with corres job types
  const where = {
    status: JobPostStatus.ACTIVE,
    ...(jobTypes.length > 0 && {
      employmentType: {
        in: jobTypes,
      },
    }),
    ...(location &&
      location !== 'worldwide' && {
        location: location,
      }),
  };

  const [data, totalCount] = await Promise.all([
    prisma.jobPost.findMany({
      where: where,
      take: pageSize,
      skip: skip,
      select: {
        jobTitle: true,
        id: true,
        salaryFrom: true,
        salaryTo: true,
        employmentType: true,
        location: true,
        createdAt: true,
        Company: {
          select: {
            name: true,
            logo: true,
            location: true,
            about: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // get newest results first
      },
    }),
    prisma.jobPost.count({
      where: {
        status: 'ACTIVE',
      },
    }),
  ]);

  return {
    jobs: data,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function JobListings({
  currentPage,
  jobTypes,
  location,
}: {
  currentPage: number;
  jobTypes: string[];
  location: string;
}) {
  const { jobs, totalPages } = await getData({
    page: currentPage,
    pageSize: 2,
    jobTypes: jobTypes,
    location: location,
  });
  return (
    <>
      {jobs.length > 0 ? (
        <div className='flex flex-col gap-6'>
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyState
          title='No jobs found'
          description='Try searching for a different job title or location'
          buttonText='Clear all filters'
          href='/'
        />
      )}

      <div className='flex justify-center mt-6'>
        <MainPagination totalPages={totalPages} currentPage={currentPage} />
      </div>
    </>
  );
}
