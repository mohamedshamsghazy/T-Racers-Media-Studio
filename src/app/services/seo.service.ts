import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  /**
   * Optional path appended to the canonical origin (e.g. "/team"). Should start
   * with a slash. If omitted, canonical defaults to the current location.
   */
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  /** Additional keyword phrases appended to the global keyword list. */
  keywords?: string[];
  /** Tell crawlers not to index this page (e.g. feature-flagged off). */
  noindex?: boolean;
}

const SITE_ORIGIN = 'https://tracersmec.com';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;
const DEFAULT_KEYWORDS = [
  'T-Racers',
  'T-Racers MEC',
  'Tanta racing',
  'Tanta racing team',
  'Egypt racing',
  'Egypt racing team',
  'Formula Student Egypt',
  'Formula Student Tanta',
  'Mechanical Engineering Club',
  'MEC Tanta',
  'race Tanta',
  'Tanta University',
];

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);

  apply(config: SeoConfig): void {
    const fullTitle = config.title.includes('T-Racers')
      ? config.title
      : `${config.title} | T-Racers MEC`;

    this.title.setTitle(fullTitle);
    this.upsert('name', 'description', config.description);

    const keywords = [...new Set([...DEFAULT_KEYWORDS, ...(config.keywords ?? [])])];
    this.upsert('name', 'keywords', keywords.join(', '));

    const canonical = config.path
      ? `${SITE_ORIGIN}${config.path.startsWith('/') ? config.path : `/${config.path}`}`
      : typeof window !== 'undefined'
      ? window.location.href
      : SITE_ORIGIN;
    this.setCanonical(canonical);

    const image = config.image ?? DEFAULT_IMAGE;
    const type = config.type ?? 'website';

    this.upsert('property', 'og:title', fullTitle);
    this.upsert('property', 'og:description', config.description);
    this.upsert('property', 'og:url', canonical);
    this.upsert('property', 'og:type', type);
    this.upsert('property', 'og:image', image);
    this.upsert('property', 'og:image:width', '1200');
    this.upsert('property', 'og:image:height', '630');
    this.upsert('property', 'og:image:alt', 'T-Racers MEC — Tanta University Formula Student team');
    this.upsert('property', 'og:site_name', 'T-Racers MEC');
    this.upsert('property', 'og:locale', 'en_US');

    this.upsert('name', 'twitter:card', 'summary_large_image');
    this.upsert('name', 'twitter:title', fullTitle);
    this.upsert('name', 'twitter:description', config.description);
    this.upsert('name', 'twitter:image', image);
    this.upsert('name', 'twitter:image:alt', 'T-Racers MEC — Tanta University Formula Student team');

    // Robots / indexability
    if (config.noindex) {
      this.upsert('name', 'robots', 'noindex, nofollow');
    } else {
      // remove any prior noindex tag
      this.meta.removeTag('name="robots"');
    }
  }

  /**
   * Inject a JSON-LD <script> tag tagged with the given id. Replaces any
   * previous script with the same id so per-page schema swaps cleanly.
   */
  setStructuredData(id: string, data: unknown): void {
    const head = this.document.head;
    if (!head) return;
    const existing = this.document.getElementById(id);
    if (existing) existing.remove();
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.text = JSON.stringify(data);
    head.appendChild(script);
  }

  clearStructuredData(id: string): void {
    const existing = this.document.getElementById(id);
    if (existing) existing.remove();
  }

  private upsert(attr: 'name' | 'property', key: string, content: string): void {
    if (!content) return;
    const selector = `${attr}="${key}"`;
    if (this.meta.getTag(selector)) {
      this.meta.updateTag({ [attr]: key, content });
    } else {
      this.meta.addTag({ [attr]: key, content });
    }
  }

  private setCanonical(href: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = href;
  }
}
