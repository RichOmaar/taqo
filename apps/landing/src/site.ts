// Single source for brand name, navigation and contact details used across
// every landing page. Change the brand or contact info here, not per page.

export const BRAND = {
  name: 'TableNow',
  tagline: 'La fila de tu restaurante, digital y en tiempo real.',
  copyright: `© ${new Date().getFullYear()} TableNow.`,
} as const;

/**
 * Contact channels for the "Empieza gratis" CTA. Onboarding is done with the
 * team (no self-serve signup yet), so every CTA points here.
 * [POR DEFINIR] Replace with the real email / WhatsApp before publishing.
 */
export const CONTACT = {
  email: 'hola@tablenow.mx',
  whatsapp: null as string | null,
} as const;

export const CTA_HREF = '/#contacto';

export const NAV_LINKS = [
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Para tu equipo', href: '/#equipo' },
  { label: 'Precios', href: '/#precios' },
];

export const FOOTER_COLUMNS = [
  {
    title: 'Producto',
    links: [
      { label: 'Cómo funciona', href: '/#como-funciona' },
      { label: 'Para tu equipo', href: '/#equipo' },
      { label: 'Métricas', href: '/#metricas' },
    ],
  },
  {
    title: 'Empieza',
    links: [
      { label: 'Precios', href: '/#precios' },
      { label: 'Cómo arrancamos', href: '/#arranque' },
      { label: 'Contacto', href: '/#contacto' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { label: 'Soporte', href: '/soporte' },
      { label: 'Prensa', href: '/prensa' },
    ],
  },
];

export const LEGAL_LINKS = [
  { label: 'Aviso de privacidad', href: '/privacidad' },
  { label: 'Términos', href: '/terminos' },
];
