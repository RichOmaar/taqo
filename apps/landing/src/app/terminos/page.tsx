import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { Button, Footer, Header } from '@nexa/ui';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Nexa',
  description: 'Términos y condiciones de uso de la plataforma Nexa.',
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
      { label: 'Soporte', href: '/#soporte' },
      { label: 'Prensa', href: '/#prensa' },
    ],
  },
];

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header logo="Nexa" links={NAV_LINKS} cta={<Button size="sm">Empieza gratis</Button>} />

      <main className="px-6 py-12 lg:px-12 lg:py-16">
        <article className="mx-auto max-w-3xl">
          <a
            href="/"
            className="mb-8 inline-flex items-center gap-2 font-body text-sm text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </a>

          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Términos y Condiciones
          </h1>
          <p className="mt-2 font-body text-sm text-muted">
            Última actualización: 13 de julio de 2026
          </p>

          <div className="mt-8 space-y-8 font-body text-foreground">
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                1. Aceptación de los términos
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Al acceder y utilizar la plataforma Nexa, usted acepta estos términos y condiciones
                en su totalidad. Si no está de acuerdo con alguna parte de estos términos, no
                deberá utilizar nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                2. Descripción del servicio
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Nexa es una plataforma tecnológica que permite a los restaurantes gestionar listas
                de espera digitales y a los comensales registrarse en dichas listas, recibir
                notificaciones sobre su turno y conocer el tiempo estimado de espera.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                3. Registro y cuenta
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Para utilizar ciertos servicios de Nexa, puede ser necesario proporcionar
                información personal. Usted se compromete a:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-muted">
                <li>Proporcionar información veraz, precisa y actualizada.</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
                <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta.</li>
                <li>
                  Ser responsable de todas las actividades que ocurran bajo su cuenta.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                4. Uso aceptable
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Al utilizar Nexa, usted se compromete a no:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-muted">
                <li>Usar el servicio para fines ilegales o no autorizados.</li>
                <li>Interferir con el funcionamiento de la plataforma.</li>
                <li>Intentar acceder a áreas restringidas del sistema.</li>
                <li>Transmitir virus, malware o código malicioso.</li>
                <li>
                  Realizar reservaciones falsas o con información fraudulenta.
                </li>
                <li>Acosar, amenazar o intimidar a otros usuarios o al personal de restaurantes.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                5. Restaurantes asociados
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Los restaurantes que utilizan Nexa son negocios independientes. Nexa no es
                responsable de:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-muted">
                <li>La calidad del servicio proporcionado por los restaurantes.</li>
                <li>Los tiempos de espera reales, que pueden variar.</li>
                <li>Las políticas propias de cada establecimiento.</li>
                <li>Cualquier disputa entre el comensal y el restaurante.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                6. Propiedad intelectual
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Todos los contenidos de la plataforma Nexa, incluyendo pero no limitado a textos,
                gráficos, logotipos, íconos, imágenes, software y código, son propiedad de Nexa o
                de sus licenciantes y están protegidos por las leyes de propiedad intelectual
                aplicables.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                7. Limitación de responsabilidad
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Nexa proporciona el servicio "tal cual" y "según disponibilidad". No garantizamos
                que el servicio será ininterrumpido, seguro o libre de errores. En la máxima
                medida permitida por la ley, Nexa no será responsable por daños indirectos,
                incidentales, especiales o consecuentes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                8. Modificaciones del servicio
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Nexa se reserva el derecho de modificar, suspender o descontinuar cualquier
                aspecto del servicio en cualquier momento, con o sin previo aviso. No seremos
                responsables ante usted o terceros por cualquier modificación, suspensión o
                discontinuación del servicio.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                9. Modificaciones a los términos
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Nos reservamos el derecho de actualizar estos términos y condiciones en cualquier
                momento. Los cambios entrarán en vigor inmediatamente después de su publicación en
                la plataforma. El uso continuado del servicio después de cualquier cambio
                constituye su aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                10. Ley aplicable y jurisdicción
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Estos términos se regirán e interpretarán de acuerdo con las leyes de México.
                Cualquier disputa que surja en relación con estos términos estará sujeta a la
                jurisdicción exclusiva de los tribunales de la Ciudad de México.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">11. Contacto</h2>
              <p className="mt-3 leading-relaxed text-muted">
                Si tiene preguntas sobre estos términos y condiciones, puede contactarnos en:{' '}
                <a href="mailto:legal@nexa.mx" className="text-primary hover:underline">
                  legal@nexa.mx
                </a>
              </p>
            </section>
          </div>
        </article>
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
