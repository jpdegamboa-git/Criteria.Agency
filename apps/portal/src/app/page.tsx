import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  // Check auth cookie — if present, go to portal; else go to login
  const cookieStore = await cookies();
  const hasSession = cookieStore.has('better-auth.session_token');

  if (hasSession) {
    redirect('/portal');
  } else {
    redirect('/login');
  }
}
