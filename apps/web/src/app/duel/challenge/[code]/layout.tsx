import type { Metadata } from 'next';

interface LayoutProps {
  params: { code: string };
}

// Dynamic metadata for OG images
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { code } = params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    const res = await fetch(`${apiUrl}/api/invites/preview/${code}`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Failed to fetch preview');

    const data = await res.json();
    const invite = data.data;

    const compatibility = Math.round(invite?.compatibility_score || 0);
    const inviterName = invite?.inviter_name || 'Someone';
    const title = `${inviterName} challenged you to a Cupid Duel!`;
    const description = compatibility > 0
      ? `They scored ${compatibility}% chemistry. Think you can beat that? Play now on CupidMe.`
      : `Think you can beat their chemistry? Accept the challenge on CupidMe.`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const ogImageUrl = `${appUrl}/api/og?name=${encodeURIComponent(inviterName)}&score=${compatibility}&code=${code}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: 'Cupid Duel Challenge | CupidMe',
      description: 'Accept the challenge and see your chemistry score on CupidMe.',
    };
  }
}

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
