import { Card } from '@nexa/ui';

const stats = [
  { label: 'Espera promedio', value: '18 min' },
  { label: 'Personas hoy', value: '142' },
  { label: 'Tasa de no-show', value: '4%' },
  { label: 'Conversión anotado → sentado', value: '92%' },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Buenas tardes</h1>
        <p className="font-body text-sm text-muted">Bistro Moderno · resumen de hoy</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex flex-col gap-1">
            <span className="font-body text-sm text-muted">{stat.label}</span>
            <span className="font-display text-3xl font-bold text-primary-dark">{stat.value}</span>
          </Card>
        ))}
      </div>

      <p className="mt-8 font-body text-xs text-muted">
        apps/admin · scaffold. El dashboard real llega en NEXA-019.
      </p>
    </main>
  );
}
