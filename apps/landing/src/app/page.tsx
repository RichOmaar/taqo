import {
  Calendar,
  Smile,
  BarChart3,
  Star,
  MessageSquare,
  Zap,
  QrCode,
  Bell,
  LayoutDashboard,
  CheckCircle,
  ClipboardList,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import {
  Badge,
  Button,
  FeatureCard,
  Footer,
  Header,
  PricingCard,
  RoadmapCard,
  SocialProof,
  StepCard,
} from '@nexa/ui';

const NAV_LINKS = [
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Precios', href: '#precios' },
];

const FEATURES = [
  {
    icon: <Calendar className="h-6 w-6" />,
    title: 'Menos no-shows',
    description: 'Reduce el ausentismo con recordatorios automáticos.',
  },
  {
    icon: <Smile className="h-6 w-6" />,
    title: 'Clientes más felices',
    description: 'Brinda libertad a tus comensales mientras esperan.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Datos de tu operación',
    description: 'Toma decisiones basadas en métricas reales de tu flujo.',
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: 'Colas VIP y visitantes',
    description: 'Gestiona diferentes tipos de clientes con facilidad.',
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Avisos por WhatsApp y SMS',
    description: 'Comunicación directa y efectiva sin apps extras.',
  },
];

const STEPS = [
  {
    step: 1,
    icon: <QrCode className="h-8 w-8" />,
    title: 'El comensal se anota',
    description:
      'Escanea un QR, ingresa un código o simplemente se registra desde el catálogo digital de tu restaurante.',
  },
  {
    step: 2,
    icon: <Bell className="h-8 w-8" />,
    title: 'Recibe avisos',
    description:
      'Conoce su posición exacta, el tiempo estimado de espera y recibe una notificación automática cuando su mesa esté lista.',
  },
  {
    step: 3,
    icon: <LayoutDashboard className="h-8 w-8" />,
    title: 'Tú gestionas y mides',
    description:
      'Controla la cola en tiempo real desde tu tablero Nexa Pro y analiza métricas de rendimiento para optimizar tus turnos.',
  },
];

const FREE_FEATURES = [
  { text: 'Gestión de fila' },
  { text: 'Colas dinámicas' },
  { text: 'Notificaciones web' },
  { text: 'Métricas básicas' },
];

const PRO_FEATURES = [
  { text: 'Notificaciones SMS y WhatsApp', isAddition: true },
  { text: 'Métricas avanzadas', isAddition: true },
  { text: 'Soporte prioritario 24/7', isAddition: true },
  { text: 'Integración con POS', isAddition: true },
];

const ROADMAP = [
  {
    phase: 'Fase 1',
    icon: <CheckCircle className="h-6 w-6" />,
    title: 'Listas de Espera Digitales',
    description: 'Gestión fluida de turnos en tiempo real para eliminar la ansiedad del comensal.',
    status: 'completed' as const,
  },
  {
    phase: 'Fase 2',
    icon: <ClipboardList className="h-6 w-6" />,
    title: 'Reservas y CRM',
    description: 'Conoce a tus clientes habituales y personaliza cada visita desde la reserva.',
    status: 'in-progress' as const,
  },
  {
    phase: 'Fase 3',
    icon: <CreditCard className="h-6 w-6" />,
    title: 'Pagos y Experiencia Total',
    description: 'Cerrando el ciclo con pagos integrados y menú digital inteligente.',
    status: 'upcoming' as const,
  },
];

const FOOTER_COLUMNS = [
  {
    title: 'Producto',
    links: [
      { label: 'Beneficios', href: '#beneficios' },
      { label: 'Cómo funciona', href: '#como-funciona' },
    ],
  },
  {
    title: 'Precios',
    links: [
      { label: 'Planes', href: '#precios' },
      { label: 'Empresas', href: '#empresas' },
    ],
  },
  {
    title: 'Nosotros',
    links: [
      { label: 'Visión', href: '#vision' },
      { label: 'Inversionistas', href: '#inversionistas' },
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header logo="Nexa" links={NAV_LINKS} cta={<Button size="sm">Empieza gratis</Button>} />

      {/* Hero Section */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Badge>Solución moderna para restaurantes</Badge>
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Digitaliza la fila
              <br />
              de tu restaurante
            </h1>
            <p className="max-w-lg font-body text-lg leading-relaxed text-muted">
              Tus comensales se anotan con un QR, reciben avisos cuando su mesa está lista, y tú lo
              gestionas todo en tiempo real.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg">Empieza gratis</Button>
              <Button variant="ghost" size="lg" className="group">
                Ver cómo funciona
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            <p className="flex items-center gap-2 font-body text-sm text-muted">
              <CheckCircle className="h-4 w-4 text-secondary" />
              Sin instalar nada · Listo en minutos
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            {/* Placeholder for phone mockup */}
            <div className="relative h-[500px] w-[280px] rounded-[3rem] bg-gradient-to-b from-primary to-primary-dark p-2 shadow-soft">
              <div className="flex h-full w-full flex-col gap-4 rounded-[2.5rem] bg-surface p-6">
                <div className="h-4 w-20 rounded-full bg-primary/20" />
                <div className="flex-1 space-y-4">
                  <div className="rounded-xl bg-primary/10 p-4">
                    <p className="font-display text-lg font-semibold text-foreground">
                      Hola, David
                    </p>
                    <p className="font-body text-sm text-muted">Tu mesa estará lista pronto</p>
                    <div className="mt-4 rounded-lg bg-surface p-3 shadow-soft">
                      <p className="text-center font-body text-xs text-muted">Tiempo de espera</p>
                      <p className="text-center font-display text-3xl font-bold text-primary">
                        15 min
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between rounded-lg bg-background p-3">
                    <span className="font-body text-sm text-muted">Posición en fila</span>
                    <span className="font-display font-semibold text-foreground">#3</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-background p-3">
                    <span className="font-body text-sm text-muted">Invitados</span>
                    <span className="font-display font-semibold text-foreground">4 personas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="bg-surface px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge>Nuestra propuesta</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Por qué los restaurantes eligen Nexa
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-muted">
              Diseñamos herramientas que humanizan la espera y optimizan cada minuto de tu
              operación.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Empieza gratis"
              description="Sin costos ocultos, moderniza tu restaurante hoy mismo."
              highlighted
              className="cursor-pointer"
            />
          </div>
          <div className="mt-12 flex justify-center border-t border-border pt-8">
            <SocialProof
              avatars={[
                'https://i.pravatar.cc/100?img=1',
                'https://i.pravatar.cc/100?img=2',
                'https://i.pravatar.cc/100?img=3',
              ]}
              text="Únete a más de 500 restaurantes que ya transformaron su servicio."
              highlight="500 restaurantes"
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="bg-primary/5 px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
              Así de fácil
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-muted">
              Modernizamos la experiencia de espera en tu restaurante para que tú te enfoques en lo
              que mejor sabes hacer: cocinar.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <StepCard
                key={step.step}
                step={step.step}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface px-6 py-3 shadow-soft">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              <span className="font-body text-sm text-foreground">
                ¿Listo para transformar tu fila?
              </span>
              <a
                href="#precios"
                className="font-display font-semibold text-primary hover:underline"
              >
                Empieza gratis hoy
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
              Empieza gratis, crece cuando quieras
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-muted">
              Diseñado para acompañar el ritmo de tu restaurante, desde la primera mesa hasta la
              expansión total.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <PricingCard
              label="Plan Esencial"
              name="Gratis"
              price="$0"
              features={FREE_FEATURES}
              cta={
                <Button variant="secondary" className="w-full">
                  Empieza gratis
                </Button>
              }
            />
            <PricingCard
              label="Plan Profesional"
              name="Pro"
              price="Consúltanos"
              priceSuffix="/mes"
              features={PRO_FEATURES}
              featuresNote="Incluye todo lo de Gratis, más:"
              recommended
              cta={<Button className="w-full">Empieza gratis</Button>}
            />
          </div>
          <p className="mt-8 text-center font-body text-sm text-muted">
            <CheckCircle className="mr-2 inline-block h-4 w-4 text-secondary" />
            Cancela o cambia de plan cuando quieras. Sin contratos forzosos.
          </p>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="bg-primary/5 px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="font-body text-sm font-medium uppercase tracking-wider text-primary">
                Nuestra Visión
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Más que una fila.
              </h2>
              <p className="mt-4 font-body leading-relaxed text-muted">
                Nexa empieza por las listas de espera, pero está construyendo una plataforma
                completa para restaurantes (reservas, CRM de comensales, menú digital, pagos).
              </p>
              <Button variant="secondary" className="mt-6">
                Contacto para aliados e inversión
              </Button>
            </div>
            <div className="flex justify-center">
              {/* Placeholder for vision image */}
              <div className="h-64 w-full max-w-md rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {ROADMAP.map((item) => (
              <RoadmapCard
                key={item.phase}
                phase={item.phase}
                icon={item.icon}
                title={item.title}
                description={item.description}
                status={item.status}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-8 py-12 text-center shadow-soft">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Empieza gratis hoy
            </h2>
            <Button
              variant="secondary"
              size="lg"
              className="border-white bg-white text-primary hover:bg-white/90"
            >
              Crear mi restaurante
            </Button>
            <p className="font-body text-sm text-white/80">Sin tarjeta · Listo en minutos</p>
          </div>
        </div>
      </section>

      {/* Footer */}
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
