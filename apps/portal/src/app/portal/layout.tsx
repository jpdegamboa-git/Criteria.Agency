import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PortalHeader from '@/components/layout/portal-header';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check — forward cookies to API
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  let session: { user: { name: string; email: string }; session: { activeOrganizationId: string } } | null = null;

  try {
    const res = await fetch(`${apiUrl}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (res.ok) {
      session = await res.json();
    }
  } catch {
    // Network error — treat as unauthenticated
  }

  if (!session || !session.session?.activeOrganizationId) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PortalHeader user={session.user} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
