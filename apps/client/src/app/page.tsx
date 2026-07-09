'use client';

import { Button, Card, Input, Stepper } from '@nexa/ui';
import { useState } from 'react';

export default function JoinPage() {
  const [partySize, setPartySize] = useState(2);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">Te damos la bienvenida</h1>
        <p className="mt-1 font-body text-muted">Bistro Moderno</p>
      </header>

      <Card className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="font-body text-sm font-semibold text-foreground">Tu nombre</span>
          <Input placeholder="O usa un apodo divertido" />
        </label>

        <div className="flex items-center justify-between">
          <span className="font-body text-sm font-semibold text-foreground">Personas</span>
          <Stepper value={partySize} onChange={setPartySize} />
        </div>

        <Button size="lg" className="mt-2 w-full">
          Unirme a la fila
        </Button>
        <Button variant="ghost" className="w-full">
          Continuar como invitado
        </Button>
      </Card>

      <p className="text-center font-body text-xs text-muted">
        apps/client · scaffold. El flujo real llega en NEXA-013.
      </p>
    </main>
  );
}
