import {
  ArrowRight,
  Bell,
  CheckCircle,
  Clock,
  Gift,
  Layers,
  ListChecks,
  Mail,
  MessageCircle,
  QrCode,
  RefreshCw,
  Smartphone,
  Star,
  TimerOff,
} from 'lucide-react';
import { Badge, FeatureCard, PricingCard, StepCard, buttonClasses, cn } from '@nexa/ui';

import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { CONTACT, CTA_HREF } from '../site';

const PROBLEMS = [
  {
    title: 'Llega alguien, ve la fila, se va',
    description:
      'No preguntó cuánto era la espera. No dejó su nombre. Para tu caja ese cliente no existió nunca — pero existió, y se fue a cenar a otro lado.',
  },
  {
    title: 'Tu recepción está apagando fuegos',
    description:
      'Una libreta, nombres gritados en la puerta, el que llegó primero reclamando, y la anfitriona tratando de acordarse de quién era quién.',
  },
  {
    title: 'Y al final de la noche no sabes qué pasó',
    description:
      'Cuánto esperó la gente de verdad, cuántos se fueron, cuántos se anotaron y nunca llegaron.',
  },
];

const ROLES = [
  {
    title: 'Tu cliente',
    description:
      'Escanea el QR de la entrada y se anota solo. Ve su lugar en la fila y cuánto falta, desde su teléfono. Se puede ir a caminar sin perder su turno.',
    className: 'bg-secondary/10',
    titleClassName: 'text-secondary-dark',
  },
  {
    title: 'Tu anfitriona',
    description:
      'Ve la fila completa en la tablet, actualizada al segundo. Avisa que la mesa está lista con un toque. Marca quién se sentó y quién no llegó.',
    className: 'bg-primary/10',
    titleClassName: 'text-primary-dark',
  },
  {
    title: 'Tú',
    description: 'Abres el panel el lunes y ves exactamente qué pasó el fin de semana.',
    className: 'border border-border bg-surface shadow-soft',
    titleClassName: 'text-foreground',
  },
];

const STEPS = [
  {
    step: 1,
    icon: <QrCode className="h-8 w-8" />,
    title: 'Se anota',
    description:
      'Escanea el QR de la entrada. Sin app y sin cuenta: le basta un nombre. Si quiere registrarse para guardar su historial, también puede.',
  },
  {
    step: 2,
    icon: <Smartphone className="h-8 w-8" />,
    title: 'Espera informado',
    description:
      'Ve su posición y el tiempo estimado desde su teléfono. Puede irse a caminar sin perder su turno.',
  },
  {
    step: 3,
    icon: <Bell className="h-8 w-8" />,
    title: 'Recibe el aviso',
    description:
      'Le avisamos cuando su mesa está lista. Y si ya no puede quedarse, cancela desde su teléfono y tu fila se libera sola.',
  },
];

const QUEUE_STATUSES = [
  { label: 'Esperando', active: true },
  { label: 'Avisado', active: true },
  { label: 'Sentado', active: true },
  { label: 'No llegó', active: false },
  { label: 'Canceló', active: false },
];

const TEAM_FEATURES = [
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: 'Todo se mueve solo',
    description:
      'Cuando alguien se anota desde la puerta, aparece en la tablet sin recargar nada. Cuando tu anfitriona lo sienta, desaparece del teléfono del cliente.',
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: 'Varias filas a la vez',
    description: 'General, VIP, visitantes. Cada una con su orden, en la misma pantalla.',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'El tiempo se ajusta solo',
    description:
      'Con el ritmo real de tu restaurante. Y si tu anfitriona sabe algo que el sistema no, lo corrige a mano.',
  },
  {
    icon: <TimerOff className="h-6 w-6" />,
    title: 'El que no llega no te bloquea',
    description:
      'Tú defines cuántos minutos esperar después del aviso; pasado ese tiempo, la fila avanza sola.',
  },
];

const METRICS = [
  { title: 'Cuánto espera tu gente de verdad', detail: 'No lo que crees, lo que mide el sistema' },
  { title: 'A qué horas te saturas', detail: 'Por día y por franja' },
  { title: 'Cuántos se anotan y no llegan', detail: 'Y qué tan seguido' },
  { title: 'Cuántos terminan sentados', detail: 'Tu conversión real de la fila' },
  { title: 'Qué tan rápido rota tu mesa', detail: 'Medido, no estimado' },
  {
    title: 'Qué opinan los que ya se fueron',
    detail: 'Reseñas ligadas a la noche en que vinieron',
  },
];

const RETENTION_FEATURES = [
  {
    icon: <Gift className="h-6 w-6" />,
    title: 'Programa de lealtad',
    description:
      'Niveles, puntos y premios con tus reglas. Cada punto queda registrado y es auditable — si un cliente reclama, tienes con qué responderle.',
  },
  {
    icon: <ListChecks className="h-6 w-6" />,
    title: 'Tus propias preguntas',
    description:
      'Armas el formulario de alta y la encuesta post-visita como quieras. Si mañana cambias una pregunta, las respuestas viejas se siguen leyendo bien.',
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: 'Reseñas donde importan',
    description:
      'La calificación del cliente llega a tu panel, junto a los tiempos de esa noche. No a una plataforma que no controlas.',
  },
];

const FREE_FEATURES = [
  { text: 'Gestión de fila en tiempo real' },
  { text: 'Todas las colas que necesites' },
  { text: 'Notificaciones web a tus clientes' },
  { text: 'Métricas de espera, rotación y no-shows' },
  { text: 'Formulario de alta configurable' },
];

const PRO_FEATURES = [
  { text: 'Avisos por WhatsApp', isAddition: true },
  { text: 'Avisos por SMS', isAddition: true },
  { text: 'Métricas avanzadas', isAddition: true },
  { text: 'Soporte prioritario', isAddition: true },
];

const ONBOARDING = [
  {
    title: 'Damos de alta tu restaurante',
    description: 'Tus colas, tus tiempos, tus reglas de espera. Una sesión contigo.',
  },
  { title: 'Te entregamos tu QR', description: 'Lo pones en la entrada y en la recepción.' },
  { title: 'Entrenamos a tu equipo', description: 'Es una pantalla; toma menos de media hora.' },
  {
    title: 'Lo probamos en un fin de semana real',
    description: 'Nosotros disponibles por si algo se atora.',
  },
];

function SectionHeading({
  eyebrow,
  title,
  lede,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  centered?: boolean;
}) {
  return (
    <div className={cn('mb-12', centered && 'text-center')}>
      <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-secondary-dark">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {lede && (
        <p
          className={cn(
            'mt-4 max-w-2xl font-body text-lg leading-relaxed text-muted',
            centered && 'mx-auto',
          )}
        >
          {lede}
        </p>
      )}
    </div>
  );
}

/** CSS-only phone showing the diner's live queue status (placeholder until a real mockup exists). */
function PhoneMockup() {
  return (
    <div className="relative">
      <div className="relative h-[520px] w-[280px] rounded-[3rem] bg-foreground p-2 shadow-[0_24px_60px_rgba(46,42,40,0.18)]">
        <div className="flex h-full w-full flex-col gap-4 rounded-[2.5rem] bg-background p-5 pt-8">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold text-foreground">
              Table<span className="text-secondary">Now</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-1 font-body text-[10px] font-semibold text-secondary-dark">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
              En vivo
            </span>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-foreground">Hola, Mariana</p>
            <p className="font-body text-xs text-muted">Fila general · 4 personas</p>
          </div>
          <div className="rounded-2xl bg-surface p-5 text-center shadow-soft">
            <p className="font-body text-xs text-muted">Tu lugar en la fila</p>
            <p className="font-display text-6xl font-bold leading-none text-primary">3</p>
            <div className="mt-4 flex items-center justify-center gap-1.5 font-body text-sm text-foreground">
              <Clock className="h-4 w-4 text-secondary" />
              Aprox. <strong className="font-semibold">15 min</strong>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 rounded-2xl bg-surface p-4 shadow-soft">
            {['Te anotaste', 'Esperando tu mesa', 'Te avisamos aquí'].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    i < 2 ? 'bg-secondary' : 'border-2 border-border bg-surface',
                  )}
                />
                <span className={cn('font-body text-xs', i < 2 ? 'text-foreground' : 'text-muted')}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-auto rounded-full border border-border py-2.5 text-center font-display text-xs font-semibold text-muted">
            Ya no puedo quedarme
          </div>
        </div>
      </div>
      <div className="absolute -left-16 bottom-28 hidden w-56 items-center gap-3 rounded-2xl bg-surface p-3 shadow-[0_18px_44px_rgba(46,42,40,0.12)] sm:flex">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Bell className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-sm font-bold text-foreground">¡Tu mesa está lista!</p>
          <p className="font-body text-[11px] text-muted">Pasa a la recepción</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="px-6 pb-20 pt-12 lg:px-12 lg:pb-28 lg:pt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col gap-6">
              <Badge className="self-start">Listas de espera para restaurantes</Badge>
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Deja de gestionar tu fila en una libreta
              </h1>
              <p className="max-w-xl font-body text-lg leading-relaxed text-muted">
                Tus clientes se anotan con un QR, ven su lugar en la fila desde su teléfono y
                reciben aviso cuando su mesa está lista. Tú ves todo en tiempo real.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href={CTA_HREF} className={buttonClasses({ size: 'lg' })}>
                  Empieza gratis
                </a>
                <a
                  href="#como-funciona"
                  className={buttonClasses({ variant: 'ghost', size: 'lg', className: 'group' })}
                >
                  Ver cómo funciona
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
              <p className="flex items-center gap-2 font-body text-sm text-muted">
                <CheckCircle className="h-4 w-4 text-secondary" />
                Sin app · Sin cuenta · Sin instalar nada
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* Problem */}
        <section id="problema" className="bg-surface px-6 py-20 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <SectionHeading
              eyebrow="El problema"
              title="Cada sábado se te van clientes que nunca contaste"
            />
            <div className="border-b border-border">
              {PROBLEMS.map((problem, i) => (
                <div
                  key={problem.title}
                  className="grid gap-2 border-t border-border py-7 sm:grid-cols-[3rem_1fr]"
                >
                  <span className="font-display text-sm font-bold text-primary">0{i + 1}</span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {problem.title}
                    </h3>
                    <p className="mt-2 max-w-2xl font-body leading-relaxed text-muted">
                      {problem.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution by role */}
        <section id="solucion" className="px-6 py-20 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="La solución"
              title="El mismo restaurante, sin la libreta"
              lede="Funciona en el navegador, en la tablet que ya tienes. No se instala nada."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {ROLES.map((role) => (
                <div
                  key={role.title}
                  className={cn(
                    'rounded-2xl p-8 transition-transform duration-300 hover:-translate-y-1',
                    role.className,
                  )}
                >
                  <h3 className={cn('font-display text-2xl font-bold', role.titleClassName)}>
                    {role.title}
                  </h3>
                  <p className="mt-3 font-body leading-relaxed text-foreground/80">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works (diner) */}
        <section id="como-funciona" className="bg-secondary/5 px-6 py-20 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Para tu cliente"
              title="Se anota en diez segundos, sin descargar nada"
              lede="Cada dato obligatorio es un cliente que se da la vuelta. Por eso basta con un nombre."
              centered
            />
            <div className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <StepCard key={step.step} {...step} />
              ))}
            </div>
          </div>
        </section>

        {/* For the team */}
        <section id="equipo" className="px-6 py-20 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Para tu equipo"
              title="La fila en una pantalla, actualizada al segundo"
            />
            <div className="mb-8 flex flex-wrap gap-2">
              {QUEUE_STATUSES.map((status) => (
                <span
                  key={status.label}
                  className={cn(
                    'rounded-full px-4 py-1.5 font-body text-sm font-medium',
                    status.active
                      ? 'bg-secondary/10 text-secondary-dark'
                      : 'border border-border text-muted',
                  )}
                >
                  {status.label}
                </span>
              ))}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {TEAM_FEATURES.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  className="border border-border shadow-soft"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section id="metricas" className="bg-surface px-6 py-20 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Lo que vas a saber"
              title="El lunes, en una pantalla"
              lede="Pregúntate cuánto espera tu gente en promedio. Casi siempre es más de lo que crees."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {METRICS.map((metric) => (
                <div
                  key={metric.title}
                  className="flex gap-4 rounded-2xl border border-border bg-background p-6"
                >
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-display text-lg font-semibold text-foreground">
                      {metric.title}
                    </p>
                    <p className="mt-1 font-body text-sm text-muted">{metric.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Retention */}
        <section id="lealtad" className="px-6 py-20 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Que vuelvan"
              title="La fila es la entrada. Lo demás es que regresen."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {RETENTION_FEATURES.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  className="border border-border shadow-soft"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="precios" className="bg-primary/5 px-6 py-20 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <SectionHeading
              eyebrow="Precio"
              title="Empieza gratis. En serio gratis."
              lede="El plan gratis no es una versión recortada: con él operas tu fila completa."
              centered
            />
            <div className="grid gap-8 md:grid-cols-2">
              <PricingCard
                label="Para empezar hoy"
                name="Gratis"
                price="$0"
                priceSuffix=""
                features={FREE_FEATURES}
                recommended
                cta={
                  <a href={CTA_HREF} className={buttonClasses({ className: 'w-full' })}>
                    Empieza gratis
                  </a>
                }
              />
              <PricingCard
                label="Cuando quieras más alcance"
                name="Pro"
                price="Se cotiza"
                priceSuffix="según tu operación"
                featuresNote="Todo lo del plan gratis, más:"
                features={PRO_FEATURES}
                cta={
                  <a
                    href={CTA_HREF}
                    className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
                  >
                    Pide tu cotización
                  </a>
                }
              />
            </div>
            <p className="mt-8 text-center font-body text-sm text-muted">
              <CheckCircle className="mr-2 inline-block h-4 w-4 text-secondary" />
              Sin tarjeta, sin plazo forzoso, sin instalar nada.
            </p>
          </div>
        </section>

        {/* Onboarding */}
        <section id="arranque" className="px-6 py-20 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <SectionHeading
              eyebrow="Cómo arrancamos"
              title="Este fin de semana puedes estar operando"
            />
            <ol className="grid gap-4 sm:grid-cols-2">
              {ONBOARDING.map((item, i) => (
                <li
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-border bg-surface p-6 shadow-soft"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-display font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 font-body text-sm text-muted">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 font-body text-lg text-muted">
              Sin contrato, sin instalación y sin cambiar tu forma de trabajar.
            </p>
          </div>
        </section>

        {/* Final CTA / contact */}
        <section id="contacto" className="px-6 pb-20 lg:px-12 lg:pb-28">
          <div className="mx-auto max-w-5xl rounded-[2rem] bg-foreground px-8 py-14 text-center sm:px-16">
            <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              Somos nuevos, y por eso te conviene entrar ahora
            </h2>
            <p className="mx-auto mt-5 max-w-2xl font-body text-lg leading-relaxed text-white/70">
              Buscamos los primeros restaurantes que lo usen en serio. Hablas directo con quien
              construyó el sistema, entras con condiciones de lanzamiento, y lo que pidas tiene peso
              real en lo que construimos después.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={`mailto:${CONTACT.email}?subject=${encodeURIComponent('Quiero probar TableNow')}`}
                className={buttonClasses({ size: 'lg' })}
              >
                <Mail className="mr-2 h-5 w-5" />
                Escríbenos
              </a>
              {CONTACT.whatsapp && (
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  className={buttonClasses({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'border-white text-white hover:bg-white/10',
                  })}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp
                </a>
              )}
            </div>
            <p className="mt-5 font-body text-sm text-white/50">{CONTACT.email}</p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
