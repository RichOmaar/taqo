import { Button, Card } from '@nexa/ui';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
        Digitaliza la fila de tu restaurante
      </h1>
      <p className="max-w-xl font-body text-lg text-muted">
        Nexa conecta a tus comensales con tu operación: se anotan por QR, ven su lugar en tiempo
        real y tú gestionas la cola sin fricción.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button size="lg">Crear mi restaurante</Button>
        <Button size="lg" variant="secondary">
          Ver cómo funciona
        </Button>
      </div>
      <Card className="mt-8 w-full max-w-md text-left">
        <p className="font-display text-lg font-semibold text-foreground">Landing (scaffold)</p>
        <p className="font-body text-sm text-muted">
          apps/landing · Next.js + @nexa/ui. Las secciones reales llegan en NEXA-022.
        </p>
      </Card>
    </main>
  );
}
