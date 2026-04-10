import { cookies } from 'next/headers';
import PortalHome from '@/components/portal/portal-home';
import type { Campaign, BrandHealthScore } from '@/lib/api';

async function getData(cookieHeader: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const [campaignsRes, bhsRes] = await Promise.allSettled([
    fetch(`${apiUrl}/api/analyst/campaigns`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    }),
    fetch(`${apiUrl}/api/analyst/bhs`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    }),
  ]);

  const campaigns: Campaign[] = campaignsRes.status === 'fulfilled' && campaignsRes.value.ok
    ? await campaignsRes.value.json()
    : [];

  let bhs: BrandHealthScore | null = null;
  if (bhsRes.status === 'fulfilled' && bhsRes.value.ok) {
    const bhsData = await bhsRes.value.json();
    bhs = bhsData.score ?? bhsData ?? null;
  }

  return { campaigns, bhs };
}

export default async function PortalPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const { campaigns, bhs } = await getData(cookieHeader);

  return <PortalHome campaigns={campaigns} bhs={bhs} />;
}
