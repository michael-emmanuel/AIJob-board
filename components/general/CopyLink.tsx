'use client';
import { Link2 } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function CopyLinkMenuItem({ jobUrl }: { jobUrl: string }) {
  async function handleCopy() {
    // copying text is async
    try {
      await navigator.clipboard.writeText(jobUrl);
      toast.success('URL copied to clipboard');
    } catch (error) {
      console.log(error);
      toast.error('Failed to copy URL');
    }
  }
  return (
    <DropdownMenuItem onSelect={handleCopy}>
      <Link2 className='size-4' />
      <span>Copy Job URL</span>
    </DropdownMenuItem>
  );
}
