'use client';

import { Button, Card, Input } from '@nexa/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signIn } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@demo.nexa');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch {
      setError('Credenciales inválidas.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-center font-display text-2xl font-bold text-foreground">
        Nexa · Recepción
      </h1>
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
