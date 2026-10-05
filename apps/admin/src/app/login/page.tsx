'use client';

import { useSession } from '@nexa/api-client/react';
import { Button, Card, Input } from '@nexa/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState('owner@demo.nexa');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // The store already distinguishes bad credentials from a failing API, so the
  // page shows its message instead of flattening everything to "invalid".
  const error = session.error;

  async function submit() {
    setBusy(true);
    try {
      await session.signIn(email, password);
      router.replace('/');
    } catch {
      // Already recorded on the session; nothing to add here.
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-center font-display text-2xl font-bold text-foreground">Nexa · Panel</h1>
      <Card className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-body text-sm text-muted">Correo</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-sm text-muted">Contraseña</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="font-body text-sm text-error">{error}</p>}
        <Button onClick={() => void submit()} disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </Card>
    </main>
  );
}
