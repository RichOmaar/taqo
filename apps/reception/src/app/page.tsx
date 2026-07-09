import { Button, WaitCard } from '@nexa/ui';

export default function BoardPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Cola en vivo</h1>
          <p className="font-body text-sm text-muted">Bistro Moderno · General</p>
        </div>
        <Button>+ Agregar manualmente</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WaitCard
          name="Familia García"
          partySize={4}
          status="waiting"
          waitingLabel="12 min esperando"
          etaLabel="~15 min"
        >
          <Button size="sm">Avisar</Button>
          <Button size="sm" variant="secondary">
            Sentar
          </Button>
        </WaitCard>
        <WaitCard
          name="Zorro Veloz 42"
          partySize={2}
          status="notified"
          waitingLabel="20 min esperando"
          etaLabel="Lista"
        >
          <Button size="sm" variant="secondary">
            Sentar
          </Button>
        </WaitCard>
        <WaitCard name="Dr. Martínez" partySize={6} status="seated" waitingLabel="Sentado 14:30" />
      </div>

      <p className="mt-8 font-body text-xs text-muted">
        apps/reception · scaffold. El board en tiempo real llega en NEXA-017.
      </p>
    </main>
  );
}
