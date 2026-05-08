'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function LogOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
      }}
    >
      Salir
    </button>
  );
}
