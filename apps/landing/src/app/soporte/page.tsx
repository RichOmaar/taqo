import type { Metadata } from 'next';
import { ArrowLeft, Mail, MessageCircle, FileText, Clock } from 'lucide-react';
import { Button, Card, Footer, Header } from '@nexa/ui';

export const metadata: Metadata = {
  title: 'Soporte — Nexa',
  description: 'Centro de ayuda y soporte de Nexa. Estamos aquí para ayudarte.',
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

const SUPPORT_OPTIONS = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: 'Correo electrónico',
    description: 'Escríbenos y te responderemos en menos de 24 horas.',
    action: 'soporte@nexa.mx',
    href: 'mailto:soporte@nexa.mx',
  },
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: 'Chat en vivo',
    description: 'Habla con nuestro equipo en tiempo real.',
    action: 'Iniciar chat',
    href: '#chat',
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Centro de ayuda',
    description: 'Encuentra respuestas en nuestra base de conocimiento.',
    action: 'Ver artículos',
    href: '#help-center',
  },
];

const FAQS = [
  {
    question: '¿Cómo me registro en la lista de espera?',
    answer:
      'Puedes registrarte escaneando el código QR del restaurante, ingresando un código de acceso o buscando el restaurante en nuestro catálogo digital.',
  },
  {
    question: '¿Cómo sé cuándo es mi turno?',
    answer:
      'Recibirás una notificación automática por web push, SMS o WhatsApp (según el plan del restaurante) cuando tu mesa esté lista.',
  },
  {
    question: '¿Necesito descargar una app?',
    answer:
      'No, Nexa funciona directamente desde el navegador de tu celular. No necesitas instalar nada.',
  },
  {
    question: '¿Qué pasa si no llego a tiempo?',
    answer:
      'Cada restaurante tiene su propia política de tiempo de espera. Generalmente tienes entre 5-10 minutos para presentarte después de ser notificado.',
  },
  {
    question: '¿Cómo configuro Nexa en mi restaurante?',
    answer:
      'Regístrate en nuestra plataforma, configura tu restaurante y colas, y genera tu código QR. El proceso toma menos de 10 minutos.',
  },
];

export default function SoportePage() {
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
              ¿Cómo podemos ayudarte?
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-body text-muted">
              Nuestro equipo está listo para resolver tus dudas y ayudarte a sacar el máximo
              provecho de Nexa.
            </p>
          </div>

          {/* Support Options */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {SUPPORT_OPTIONS.map((option) => (
              <Card key={option.title} className="flex flex-col items-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {option.icon}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {option.title}
                </h3>
                <p className="mt-2 font-body text-sm text-muted">{option.description}</p>
                <a
                  href={option.href}
                  className="mt-4 font-display text-sm font-semibold text-primary hover:underline"
                >
                  {option.action}
                </a>
              </Card>
            ))}
          </div>

          {/* Response Time */}
          <div className="mt-8 flex items-center justify-center gap-2 rounded-full bg-secondary/10 px-4 py-2">
            <Clock className="h-4 w-4 text-secondary" />
            <span className="font-body text-sm text-foreground">
              Tiempo de respuesta promedio: <strong>menos de 2 horas</strong>
            </span>
          </div>

          {/* FAQs */}
          <section className="mt-16">
            <h2 className="text-center font-display text-2xl font-bold text-foreground">
              Preguntas frecuentes
            </h2>
            <div className="mt-8 space-y-4">
              {FAQS.map((faq) => (
                <Card key={faq.question} className="p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {faq.question}
                  </h3>
                  <p className="mt-2 font-body text-muted">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Contact CTA */}
          <section className="mt-16 rounded-2xl bg-primary/5 p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">
              ¿No encuentras lo que buscas?
            </h2>
            <p className="mt-2 font-body text-muted">
              Nuestro equipo está disponible para ayudarte con cualquier duda.
            </p>
            <Button className="mt-6">Contactar soporte</Button>
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
