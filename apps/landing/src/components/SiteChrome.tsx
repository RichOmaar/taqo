import { Footer, Header, buttonClasses } from '@nexa/ui';

import { BRAND, CTA_HREF, FOOTER_COLUMNS, LEGAL_LINKS, NAV_LINKS } from '../site';

/** TableNow wordmark: "Table" in ink, "Now" in teal. Text until the SVG logo exists. */
export function Wordmark() {
  return (
    <span className="tracking-tight text-foreground">
      Table<span className="text-secondary">Now</span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <Header
      logo={<Wordmark />}
      links={NAV_LINKS}
      cta={
        <a href={CTA_HREF} className={buttonClasses({ size: 'sm' })}>
          Empieza gratis
        </a>
      }
    />
  );
}

export function SiteFooter() {
  return (
    <Footer
      logo={<Wordmark />}
      tagline={BRAND.tagline}
      columns={FOOTER_COLUMNS}
      legalLinks={LEGAL_LINKS}
      copyright={BRAND.copyright}
    />
  );
}
