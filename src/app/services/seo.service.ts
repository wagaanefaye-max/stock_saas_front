import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import {
  SEO_BY_ROUTE,
  SEO_DEFAULT,
  SEO_OG_IMAGE,
  SEO_PRIVATE_PREFIXES,
  SEO_SITE_NAME,
  SeoMeta
} from '../config/seo.config';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly siteUrl = environment.siteUrl.replace(/\/$/, '');

  updateForUrl(url: string): void {
    const path = this.normalizePath(url);
    const meta = this.resolveMeta(path);
    const canonical = `${this.siteUrl}${path === '/' ? '/' : path}`;

    this.title.setTitle(meta.title);
    this.setMetaTag('name', 'description', meta.description);
    this.setMetaTag('name', 'robots', meta.robots ?? 'index,follow');
    this.setMetaTag('property', 'og:title', meta.title);
    this.setMetaTag('property', 'og:description', meta.description);
    this.setMetaTag('property', 'og:url', canonical);
    this.setMetaTag('property', 'og:type', meta.ogType ?? 'website');
    this.setMetaTag('property', 'og:site_name', SEO_SITE_NAME);
    this.setMetaTag('property', 'og:image', SEO_OG_IMAGE);
    this.setMetaTag('property', 'og:locale', 'fr_SN');
    this.setMetaTag('name', 'twitter:card', 'summary_large_image');
    this.setMetaTag('name', 'twitter:title', meta.title);
    this.setMetaTag('name', 'twitter:description', meta.description);
    this.setMetaTag('name', 'twitter:image', SEO_OG_IMAGE);
    this.setCanonical(canonical);
  }

  private resolveMeta(path: string): SeoMeta {
    if (SEO_PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return {
        ...SEO_DEFAULT,
        title: `${SEO_SITE_NAME} — Espace connecté`,
        robots: 'noindex,nofollow'
      };
    }

    const segment = path === '/' ? '' : path.split('/').filter(Boolean)[0] ?? '';
    return SEO_BY_ROUTE[segment] ?? SEO_DEFAULT;
  }

  private normalizePath(url: string): string {
    const withoutQuery = url.split('?')[0].split('#')[0];
    if (!withoutQuery || withoutQuery === '') {
      return '/';
    }
    return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  }

  private setCanonical(href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setMetaTag(attrSelector: 'name' | 'property', attrName: string, content: string): void {
    const selector = `${attrSelector}="${attrName}"`;
    if (this.meta.getTag(selector)) {
      this.meta.updateTag({ [attrSelector]: attrName, content });
    } else {
      this.meta.addTag({ [attrSelector]: attrName, content });
    }
  }
}
