'use client';

import { createClient } from '@/lib/supabase/client';
import { beginRequestLoading } from '@/lib/request-loading';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function LogOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      className="shrink-0 px-3 py-2 text-sm"
      loading={busy}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const release = beginRequestLoading();
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push('/login');
          router.refresh();
        } finally {
          release();
          setBusy(false);
        }
      }}
    >
      Salir
    </Button>
  );
}
