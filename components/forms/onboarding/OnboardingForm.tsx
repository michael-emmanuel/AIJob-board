'use client';
import Image from 'next/image';
import Logo from '@/public/logo.png';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { UserTypeSelection } from '@/components/forms/onboarding/UserTypeForm';
import { CompanyForm } from '@/components/forms/onboarding/CompanyForm';
import { JobSeekerForm } from '@/components/forms/onboarding/JobSeekerForm';

type UserSelectionType = 'company' | 'jobSeeker' | null;

export function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserSelectionType>(null);

  function handleUserTypeSelection(type: UserSelectionType) {
    setUserType(type);
    setStep(2);
  }

  function renderStep() {
    switch (step) {
      case 1:
        return <UserTypeSelection onSelect={handleUserTypeSelection} />;

      case 2:
        return userType === 'company' ? <CompanyForm /> : <JobSeekerForm />;
      default:
        return null;
    }
  }

  return (
    <>
      <div className='flex items-center gap-4 mb-10'>
        <Image src={Logo} alt='jobboard logo' width={50} height={50} />
        <h1 className='text-4xl font-bold'>
          Job<span className='text-primary'>Genius</span>
        </h1>
      </div>

      <Card className='max-w-lg w-full'>
        <CardContent className='p-6'>{renderStep()}</CardContent>
      </Card>
    </>
  );
}
