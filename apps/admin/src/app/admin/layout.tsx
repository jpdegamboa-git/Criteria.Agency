import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

async function getSession(cookieHeader: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json() as { user?: { email: string } } | null;
    return data;
  } catch {
    return null;
  }
}

async function getAlertCount(cookieHeader: string): Promise<number> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/analyst/alerts?status=open`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return 0;
    const data = await res.json() as unknown[];
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const session = await getSession(cookieHeader);
  if (!session?.user) {
    redirect('/login');
  }

  const alertCount = await getAlertCount(cookieHeader);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header alertCount={alertCount} userEmail={session.user.email} />
      {/* Main content — offset for sidebar (240px) and header (56px) */}
      <main className="pl-60 pt-14 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
