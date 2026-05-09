import { headers } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const initialPathname = h.get('x-nutrimax-pathname') ?? '';
  return <AppShell initialPathname={initialPathname}>{children}</AppShell>;
}
