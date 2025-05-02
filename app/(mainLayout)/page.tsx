import { JobFilter } from '@/components/general/JobFilters';
import { JobListings } from '@/components/general/JobListings';
import { JobListingLoading } from '@/components/general/JobListingsLoading';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { Suspense } from 'react';

type SearchParams = {
  searchParams: Promise<{
    page?: string;
    jobTypes?: string;
    location?: string;
  }>;
};

export default async function Home({ searchParams }: SearchParams) {
  const params = await searchParams;
  // if key changes rerun suspense boundary
  // hence why we add key to suspense to show suspense on page change
  const currentPage = Number(params.page) || 1;
  const jobTypes = params.jobTypes?.split(',') || [];
  const location = params.location || '';

  return (
    <div className='grid grid-cols-3 gap-8'>
      <JobFilter />
      <div className='col-span-2 flex flex-col gap-6'>
        <Suspense fallback={<JobListingLoading />} key={currentPage}>
          <JobListings
            currentPage={currentPage}
            jobTypes={jobTypes}
            location={location}
          />
        </Suspense>
      </div>
    </div>
  );
}
