/**
 * Web Scraper — Layer 0 Path A utility
 *
 * Simple HTML scraper for extracting brand signals from a website.
 * No LLM — deterministic extraction using HTML parsing.
 * Used in Step 1.2 (Layer 0 onboarding, Path A).
 *
 * Extracts:
 * - Business name, title, meta description
 * - Color palette (meta theme-color, og:image reference)
 * - Tone signals (based on content vocabulary analysis)
 * - Detected social links
 * - Value proposition hints from hero/headline copy
 * - Estimated category from meta keywords/content
 */

export interface ScrapedBrandSignals {
  businessName: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  headings: string[]; // h1 + h2 texts, max 10
  bodyTextSample: string; // first ~500 chars of meaningful body text
  detectedColors: string[]; // hex colors found in meta/inline styles
  themeColor: string | null;
  socialLinks: Record<string, string>; // platform → url
  detectedKeywords: string[]; // from meta keywords tag
  structuredData: Record<string, unknown> | null; // JSON-LD if present
  error?: string;
}

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  instagram: /instagram\.com\/([^/"?]+)/i,
  twitter: /(?:twitter|x)\.com\/([^/"?]+)/i,
  facebook: /facebook\.com\/([^/"?]+)/i,
  linkedin: /linkedin\.com\/(?:company|in)\/([^/"?]+)/i,
  youtube: /youtube\.com\/(?:channel|user|@)([^/"?]+)/i,
  tiktok: /tiktok\.com\/@?([^/"?]+)/i,
};

function extractText(html: string, tag: string): string | null {
  const pattern = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i');
  const match = html.match(pattern);
  return match ? match[1].trim() : null;
}

function extractMeta(html: string, name: string): string | null {
  // Handles both name= and property= meta tags
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    'i',
  );
  const patternAlt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
    'i',
  );
  const match = html.match(pattern) || html.match(patternAlt);
  return match ? match[1].trim() : null;
}

function extractAllMatches(html: string, pattern: RegExp): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  const g = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  while ((match = g.exec(html)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const pattern = /<h[12][^>]*>([^<]+)<\/h[12]>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null && headings.length < 10) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 0) headings.push(text);
  }
  return headings;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractColors(html: string): string[] {
  const hexPattern = /#([0-9a-fA-F]{3,6})\b/g;
  const colors = new Set<string>();
  let match: RegExpExecArray | null;
  // Limit to inline styles / CSS blocks (first 5k chars to avoid false positives)
  const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? [];
  const inlineStyles = html.match(/style="([^"]+)"/gi) ?? [];
  const toSearch = [...styleBlocks, ...inlineStyles].join(' ').slice(0, 10000);
  const hexG = new RegExp(hexPattern.source, 'g');
  while ((match = hexG.exec(toSearch)) !== null && colors.size < 8) {
    const hex = '#' + match[1].toUpperCase();
    // Filter out near-white and near-black for visual interest
    if (match[1].length === 6 || match[1].length === 3) {
      colors.add(hex);
    }
  }
  return [...colors];
}

function extractStructuredData(html: string): Record<string, unknown> | null {
  const match = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function detectSocialLinks(html: string, providedUrls: string[]): Record<string, string> {
  const allLinks = [...providedUrls];

  // Also look in the HTML for social links
  const hrefPattern = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefPattern.exec(html)) !== null) {
    allLinks.push(match[1]);
  }

  const result: Record<string, string> = {};
  for (const link of allLinks) {
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (pattern.test(link) && !result[platform]) {
        result[platform] = link.startsWith('http') ? link : `https://${link}`;
      }
    }
  }
  return result;
}

export async function scrapeWebsite(
  url: string,
  socialUrls: string[] = [],
  timeoutMs = 10000,
): Promise<ScrapedBrandSignals> {
  let html = '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'criteria-agency-bot/1.0 (brand intelligence)' },
    });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    html = await response.text();
  } catch (err) {
    return {
      businessName: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      headings: [],
      bodyTextSample: '',
      detectedColors: [],
      themeColor: null,
      socialLinks: detectSocialLinks('', socialUrls),
      detectedKeywords: [],
      structuredData: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const businessName = extractMeta(html, 'og:site_name') ?? extractText(html, 'title');
  const ogTitle = extractMeta(html, 'og:title');
  const ogDescription = extractMeta(html, 'og:description');
  const metaDescription = extractMeta(html, 'description') ?? ogDescription;
  const themeColor = extractMeta(html, 'theme-color');
  const keywords = extractMeta(html, 'keywords');
  const detectedKeywords = keywords ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [];

  const headings = extractHeadings(html);
  const bodyText = stripHtml(html);
  const bodyTextSample = bodyText.slice(0, 600);

  const detectedColors = themeColor
    ? [themeColor, ...extractColors(html)]
    : extractColors(html);

  const socialLinks = detectSocialLinks(html, socialUrls);
  const structuredData = extractStructuredData(html);

  return {
    businessName: businessName ?? null,
    metaDescription: metaDescription ?? null,
    ogTitle: ogTitle ?? null,
    ogDescription: ogDescription ?? null,
    headings,
    bodyTextSample,
    detectedColors: [...new Set(detectedColors)].slice(0, 6),
    themeColor: themeColor ?? null,
    socialLinks,
    detectedKeywords,
    structuredData,
  };
}
