import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { Button, Footer, Header } from '@nexa/ui';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad — Nexa',
  description: 'Conoce cómo Nexa protege y maneja tu información personal.',
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

export default function PrivacidadPage() {
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
            Aviso de Privacidad
          </h1>
          <p className="mt-2 font-body text-sm text-muted">
            Última actualización: 13 de julio de 2026
          </p>

          <div className="mt-8 space-y-8 font-body text-foreground">
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                1. Responsable del tratamiento
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Nexa Technologies, S.A. de C.V. (en adelante "Nexa") con domicilio en Ciudad de
                México, México, es responsable del tratamiento de sus datos personales conforme a
                la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                2. Datos personales que recabamos
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Para las finalidades señaladas en el presente aviso de privacidad, podemos recabar
                las siguientes categorías de datos personales:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-muted">
                <li>Datos de identificación: nombre, alias o apodo.</li>
                <li>Datos de contacto: número de teléfono móvil, correo electrónico.</li>
                <li>
                  Datos de uso del servicio: historial de visitas, preferencias, tiempo de espera.
                </li>
                <li>
                  Datos del dispositivo: tipo de navegador, sistema operativo, dirección IP.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                3. Finalidades del tratamiento
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Sus datos personales serán utilizados para las siguientes finalidades primarias:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-muted">
                <li>Registrar su lugar en la lista de espera del restaurante.</li>
                <li>Enviar notificaciones sobre el estado de su turno.</li>
                <li>Comunicarnos con usted cuando su mesa esté lista.</li>
                <li>Mejorar la experiencia del servicio.</li>
              </ul>
              <p className="mt-3 leading-relaxed text-muted">
                De manera adicional, utilizaremos su información para finalidades secundarias:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-muted">
                <li>Enviar promociones y ofertas de restaurantes asociados.</li>
                <li>Realizar estadísticas y análisis de uso del servicio.</li>
                <li>Mejorar nuestros productos y servicios.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                4. Transferencia de datos
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Sus datos personales pueden ser compartidos con los restaurantes donde usted se
                registre en la lista de espera, únicamente para gestionar su turno. No vendemos ni
                comercializamos sus datos personales a terceros.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                5. Derechos ARCO
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los
                utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su
                derecho solicitar la corrección de su información personal en caso de que esté
                desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de
                nuestros registros o bases de datos cuando considere que la misma no está siendo
                utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos
                personales para fines específicos (Oposición).
              </p>
              <p className="mt-3 leading-relaxed text-muted">
                Para ejercer cualquiera de estos derechos, puede enviar una solicitud a:{' '}
                <a href="mailto:privacidad@nexa.mx" className="text-primary hover:underline">
                  privacidad@nexa.mx
                </a>
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                6. Uso de cookies
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia en nuestra
                plataforma, recordar sus preferencias y analizar el tráfico del sitio. Puede
                configurar su navegador para rechazar cookies, aunque esto puede afectar algunas
                funcionalidades del servicio.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">
                7. Cambios al aviso de privacidad
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Nos reservamos el derecho de efectuar modificaciones o actualizaciones al presente
                aviso de privacidad. Cualquier cambio será notificado a través de nuestra
                plataforma o por correo electrónico.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">8. Contacto</h2>
              <p className="mt-3 leading-relaxed text-muted">
                Si tiene alguna pregunta sobre este aviso de privacidad o sobre el tratamiento de
                sus datos personales, puede contactarnos en:{' '}
                <a href="mailto:privacidad@nexa.mx" className="text-primary hover:underline">
                  privacidad@nexa.mx
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
