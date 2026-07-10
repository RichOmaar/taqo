import { Button, Card } from '@nexa/ui';

const steps = [
  {
    icon: '📲',
    title: 'El comensal se anota',
    body: 'Escanea un QR o entra por código. Sin apps que descargar, con o sin cuenta.',
  },
  {
    icon: '🔔',
    title: 'Recibe avisos de su turno',
    body: 'Ve su lugar y tiempo estimado en vivo, y le avisamos cuando su mesa está lista.',
  },
  {
    icon: '📊',
    title: 'Tú gestionas la fila',
    body: 'Avisa, sienta o marca no-show en tiempo real, con métricas de tu operación.',
  },
];

const benefits = [
  {
    title: 'Menos no-shows',
    body: 'Expiración automática y avisos oportunos reducen los lugares que se pierden.',
  },
  {
    title: 'Comensales felices',
    body: 'Esperan donde quieran, sin la ansiedad de una fila sin información.',
  },
  {
    title: 'Datos accionables',
    body: 'Espera promedio, horas pico, conversión y rotación en un panel claro.',
  },
  {
    title: 'Cero fricción',
    body: 'Alta en segundos por QR; tu equipo gestiona todo desde una webapp.',
  },
];

const plans = [
  {
    name: 'Gratis',
    price: '$0',
    period: 'para siempre',
    highlight: false,
    features: [
      'Gestión de fila y colas',
      'Notificaciones web',
      'Métricas básicas',
      'Alta por QR y código',
    ],
    cta: 'Empieza gratis',
  },
  {
    name: 'Pro',
    price: '$499',
    period: '/mes',
    highlight: true,
    features: [
      'Todo lo de Gratis',
      'Avisos por SMS y WhatsApp',
      'Métricas avanzadas',
      'Soporte prioritario',
    ],
    cta: 'Mejorar a Pro',
  },
];

const future = [
  { title: 'Reservaciones', body: 'Del walk-in a la reserva anticipada.' },
  { title: 'CRM de comensales', body: 'Conoce y fideliza a tus clientes frecuentes.' },
  { title: 'Menú y pagos', body: 'Menú digital y flujo de pago integrados.' },
];

const container = 'mx-auto w-full max-w-6xl px-6';

export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <nav className={`${container} flex h-16 items-center justify-between`}>
          <span className="font-display text-xl font-bold text-primary-dark">Nexa</span>
          <div className="hidden items-center gap-8 font-body text-sm text-foreground sm:flex">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#beneficios">Beneficios</a>
            <a href="#precios">Precios</a>
          </div>
          <a href="#precios">
            <Button size="sm">Crear mi restaurante</Button>
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background">
        <div className={`${container} flex flex-col items-center gap-6 py-24 text-center`}>
          <span className="rounded-full bg-secondary/15 px-4 py-1 font-body text-sm font-semibold text-secondary-dark">
            Listas de espera, sin fricción
          </span>
          <h1 className="max-w-3xl font-display text-5xl font-bold leading-tight text-foreground">
            Digitaliza la fila de tu restaurante
          </h1>
          <p className="max-w-xl font-body text-lg text-muted">
            Tus comensales se anotan por QR y siguen su turno en tiempo real. Tú gestionas la cola
            sin libretas ni gritar nombres.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            <a href="#precios">
              <Button size="lg">Empieza gratis</Button>
            </a>
            <a href="#como-funciona">
              <Button size="lg" variant="secondary">
                Ver cómo funciona
              </Button>
            </a>
          </div>
          <p className="font-body text-sm text-muted">Sin tarjeta · Listo en minutos</p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-24">
        <div className={container}>
          <h2 className="text-center font-display text-3xl font-bold text-foreground">
            Así de fácil
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.title} className="flex flex-col gap-3">
                <span className="text-4xl">{step.icon}</span>
                <h3 className="font-display text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="font-body text-muted">{step.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="bg-surface py-24">
        <div className={container}>
          <h2 className="text-center font-display text-3xl font-bold text-foreground">
            Por qué los restaurantes eligen Nexa
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-4">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display font-bold text-primary-dark">
                  ✓
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="font-body text-muted">{benefit.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="py-24">
        <div className={container}>
          <h2 className="text-center font-display text-3xl font-bold text-foreground">
            Empieza gratis, crece cuando quieras
          </h2>
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlight ? 'flex flex-col gap-4 ring-2 ring-primary' : 'flex flex-col gap-4'
                }
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  {plan.highlight && (
                    <span className="rounded-full bg-primary/15 px-3 py-1 font-body text-xs font-semibold text-primary-dark">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className="font-display text-4xl font-bold text-foreground">
                  {plan.price}
                  <span className="font-body text-base font-normal text-muted"> {plan.period}</span>
                </p>
                <ul className="flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 font-body text-muted">
                      <span className="text-secondary-dark">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.highlight ? 'primary' : 'secondary'} className="mt-2">
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visión */}
      <section className="bg-surface py-24">
        <div className={`${container} text-center`}>
          <h2 className="font-display text-3xl font-bold text-foreground">Más que una fila</h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-muted">
            Nexa nace como lista de espera, pero está diseñada para acompañar toda la relación con
            tus comensales.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {future.map((item) => (
              <Card key={item.title} className="flex flex-col gap-2">
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="font-body text-muted">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + footer */}
      <section className="bg-primary py-20">
        <div className={`${container} flex flex-col items-center gap-6 text-center`}>
          <h2 className="font-display text-4xl font-bold text-primary-foreground">
            Empieza gratis hoy
          </h2>
          <p className="max-w-lg font-body text-primary-foreground/90">
            Digitaliza tu lista de espera en minutos. Sin tarjeta, sin compromisos.
          </p>
          <a href="#precios">
            <Button size="lg" className="bg-surface text-primary-dark hover:bg-surface">
              Crear mi restaurante
            </Button>
          </a>
        </div>
      </section>

      <footer className={`${container} flex flex-col items-center gap-2 py-10 text-center`}>
        <span className="font-display text-lg font-bold text-primary-dark">Nexa</span>
        <p className="font-body text-sm text-muted">Conectamos clientes y negocios.</p>
        <p className="font-body text-xs text-muted">© 2026 Nexa</p>
      </footer>
    </>
  );
}
