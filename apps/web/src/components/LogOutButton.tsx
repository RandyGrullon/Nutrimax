'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function LogOutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="secondary"
      className="shrink-0 px-3 py-2 text-sm"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
      }}
    >
      Salir
    </Button>
  );
}
