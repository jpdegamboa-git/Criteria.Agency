// Simple inline SVG icons for channel/platform logos
// Used in funnel matrix row labels and activation chips

interface IconProps {
  size?: number;
  className?: string;
}

export function GoogleIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function MetaIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" fill="#1877F2"/>
    </svg>
  );
}

export function InstagramIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0">
          <stop offset="0%" stopColor="#FD5"/>
          <stop offset="50%" stopColor="#FF543E"/>
          <stop offset="100%" stopColor="#C837AB"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig)" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="5" stroke="url(#ig)" strokeWidth="2" fill="none"/>
      <circle cx="18" cy="6" r="1.5" fill="url(#ig)"/>
    </svg>
  );
}

export function YouTubeIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" fill="#FF0000"/>
    </svg>
  );
}

export function LinkedInIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77A1.75 1.75 0 0 0 0 1.73v20.54A1.75 1.75 0 0 0 1.77 24h20.46A1.75 1.75 0 0 0 24 22.27V1.73A1.75 1.75 0 0 0 22.23 0z" fill="#0A66C2"/>
    </svg>
  );
}

export function XIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000"/>
    </svg>
  );
}

export function TikTokIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 10.86 4.48V12.7a8.2 8.2 0 0 0 4.79 1.53h.8V10.8a4.84 4.84 0 0 1-.01-4.11z" fill="#000"/>
    </svg>
  );
}

export function MailIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7l-10 7L2 7"/>
    </svg>
  );
}

export function SEOIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

export function DisplayIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

export function StarIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

export function UsersIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

// ── Mailchimp (simplified monkey silhouette) ──

export function MailchimpIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M18.86 12.76c.24-.39.38-.84.38-1.32 0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5c0 .48.14.93.38 1.32A4.97 4.97 0 0 0 12 17c-1.3 0-2.48-.5-3.37-1.31.02-.06.03-.13.03-.19 0-.55-.45-1-1-1s-1 .45-1 1c0 .26.1.5.27.68A6.96 6.96 0 0 0 12 19a6.96 6.96 0 0 0 5.07-2.82c.17-.18.27-.42.27-.68 0-.55-.45-1-1-1s-1 .45-1 1c0 .06.01.13.03.19A4.97 4.97 0 0 1 12 17a4.97 4.97 0 0 1-2.62-4.24c.24-.39.38-.84.38-1.32 0-1.38-1.12-2.5-2.5-2.5S4.76 10.06 4.76 11.44c0 .48.14.93.38 1.32" fill="none" stroke="#FFE01B" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="9" fill="none" stroke="#FFE01B" strokeWidth="1.5"/>
    </svg>
  );
}

// ── Generic (circle with dot) ──

export function GenericIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ── Map: Channels → generic icons (for row labels) ──
import type { Channel, Platform } from "@/lib/portal-types";
import type { ComponentType } from "react";

// Row labels use generic icons representing the channel category
export const channelIconMap: Record<Channel, ComponentType<IconProps>> = {
  sem: ({ size, className }: IconProps) => (
    <svg width={size || 14} height={size || 14} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  social_ads: ({ size, className }: IconProps) => (
    <svg width={size || 14} height={size || 14} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  ),
  display: DisplayIcon,
  video_ott: ({ size, className }: IconProps) => (
    <svg width={size || 14} height={size || 14} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  seo_content: SEOIcon,
  email: MailIcon,
  social_org: UsersIcon,
  influencers: StarIcon,
};

// ── Map: Platform → real brand icons (for activation chips) ──

export const platformIconMap: Record<Platform, ComponentType<IconProps>> = {
  google: GoogleIcon,
  meta: MetaIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  linkedin: LinkedInIcon,
  tiktok: TikTokIcon,
  x: XIcon,
  mailchimp: MailIcon,
  generic: GenericIcon,
};
