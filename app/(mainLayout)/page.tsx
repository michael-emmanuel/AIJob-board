import { JobFilter } from '@/components/general/JobFilters';
import { JobListings } from '@/components/general/JobListings';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

export default function Home() {
  return (
    <div className='grid grid-cols-3 gap-8'>
      <JobFilter />
      <div className='col-span-2 flex flex-col gap-6'>
        <JobListings />
      </div>
    </div>
  );
}
