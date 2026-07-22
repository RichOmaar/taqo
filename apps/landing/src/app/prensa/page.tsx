import type { Metadata } from 'next';
import { ArrowLeft, Download, Mail, ExternalLink } from 'lucide-react';
import { Badge, Button, Card, Footer, Header } from '@nexa/ui';

export const metadata: Metadata = {
  title: 'Prensa — Nexa',
  description: 'Recursos de prensa, noticias y kit de medios de Nexa.',
};

const NAV_LINKS = [
  { label: 'Beneficios', href: '/#beneficios' },
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Precios', href: '/#precios' },
];

const FOOTER_COLUMNS = [
  {
    title: 'Producto',
    links: [
      { label: 'Beneficios', href: '/#beneficios' },
      { label: 'Cómo funciona', href: '/#como-funciona' },
    ],
  },
  {
    title: 'Precios',
    links: [
      { label: 'Planes', href: '/#precios' },
      { label: 'Empresas', href: '/#empresas' },
    ],
  },
  {
    title: 'Nosotros',
    links: [
      { label: 'Visión', href: '/#vision' },
      { label: 'Inversionistas', href: '/#inversionistas' },
    ],
  },
  {
    title: 'Contacto',
    links: [
      { label: 'Soporte', href: '/soporte' },
      { label: 'Prensa', href: '/prensa' },
    ],
  },
];

const PRESS_RELEASES = [
  {
    date: '15 de junio de 2026',
    title: 'Nexa lanza su plataforma de listas de espera digitales en México',
    excerpt:
      'La startup mexicana presenta una solución innovadora para digitalizar la experiencia de espera en restaurantes.',
    tag: 'Lanzamiento',
  },
  {
    date: '1 de mayo de 2026',
    title: 'Nexa cierra ronda pre-seed para expandir operaciones',
    excerpt:
      'La compañía asegura financiamiento para acelerar el desarrollo de nuevas funcionalidades y expandir su equipo.',
    tag: 'Inversión',
  },
  {
    date: '20 de marzo de 2026',
    title: 'Nexa anuncia alianza con asociación de restauranteros',
    excerpt:
      'Más de 100 restaurantes se suman a la plataforma como parte del programa piloto en Ciudad de México.',
    tag: 'Alianza',
  },
];

const MEDIA_KIT_ITEMS = [
  { name: 'Logo Nexa (PNG)', size: '2.4 MB' },
  { name: 'Logo Nexa (SVG)', size: '124 KB' },
  { name: 'Guía de marca', size: '5.1 MB' },
  { name: 'Capturas de pantalla', size: '8.7 MB' },
  { name: 'Fotos del equipo', size: '12.3 MB' },
];

const STATS = [
  { value: '500+', label: 'Restaurantes' },
  { value: '50,000+', label: 'Comensales atendidos' },
  { value: '15 min', label: 'Reducción promedio de espera' },
  { value: '4.8/5', label: 'Satisfacción del cliente' },
];

export default function PrensaPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header logo="Nexa" links={NAV_LINKS} cta={<Button size="sm">Empieza gratis</Button>} />

      <main className="px-6 py-12 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-4xl">
          <a
            href="/"
            className="mb-8 inline-flex items-center gap-2 font-body text-sm text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </a>

          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Sala de Prensa
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-body text-muted">
              Recursos, noticias y materiales para medios de comunicación.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-surface p-4 text-center shadow-soft">
                <p className="font-display text-2xl font-bold text-primary">{stat.value}</p>
                <p className="mt-1 font-body text-xs text-muted">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* About Nexa */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-foreground">Acerca de Nexa</h2>
            <div className="mt-4 space-y-4 font-body leading-relaxed text-muted">
              <p>
                Nexa es una plataforma tecnológica mexicana que digitaliza la experiencia de
                espera en restaurantes. Fundada en 2026, nuestra misión es humanizar la espera y
                optimizar la operación de los restaurantes a través de tecnología accesible y
                fácil de usar.
              </p>
              <p>
                Nuestra solución permite a los comensales registrarse en listas de espera
                digitales mediante códigos QR, recibir notificaciones en tiempo real sobre su
                turno, y a los restaurantes gestionar sus colas de manera eficiente con métricas
                y análisis detallados.
              </p>
              <p>
                Con sede en Ciudad de México, Nexa está transformando la industria restaurantera
                con un enfoque en la hospitalidad y la tecnología accesible.
              </p>
            </div>
          </section>

          {/* Press Releases */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Comunicados de prensa
            </h2>
            <div className="mt-6 space-y-4">
              {PRESS_RELEASES.map((release) => (
                <Card key={release.title} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-body text-sm text-muted">{release.date}</span>
                        <Badge>{release.tag}</Badge>
                      </div>
                      <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                        {release.title}
                      </h3>
                      <p className="mt-2 font-body text-sm text-muted">{release.excerpt}</p>
                    </div>
                    <ExternalLink className="h-5 w-5 shrink-0 text-muted" />
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Media Kit */}
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-foreground">Kit de medios</h2>
            <p className="mt-2 font-body text-muted">
              Descarga logos, imágenes y recursos de marca para tus publicaciones.
            </p>
            <Card className="mt-6 p-6">
              <div className="space-y-3">
                {MEDIA_KIT_ITEMS.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg bg-background p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="h-4 w-4 text-muted" />
                      <span className="font-body text-sm text-foreground">{item.name}</span>
                    </div>
                    <span className="font-body text-xs text-muted">{item.size}</span>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="mt-6 w-full">
                Descargar todo el kit
              </Button>
            </Card>
          </section>

          {/* Contact */}
          <section className="mt-16 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Contacto de prensa
            </h2>
            <p className="mt-2 font-body text-muted">
              Para entrevistas, información adicional o solicitudes de medios:
            </p>
            <a
              href="mailto:prensa@nexa.mx"
              className="mt-4 inline-flex items-center gap-2 font-display font-semibold text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              prensa@nexa.mx
            </a>
          </section>
        </div>
      </main>

      <Footer
        logo="Nexa"
        tagline="Conectamos clientes y negocios a través de una hospitalidad cálida y tecnológica."
        columns={FOOTER_COLUMNS}
        legalLinks={[
          { label: 'Aviso de privacidad', href: '/privacidad' },
          { label: 'Términos', href: '/terminos' },
        ]}
        copyright="© 2026 Nexa."
        slogan="La hospitalidad comienza aquí."
      />
    </div>
  );
}
