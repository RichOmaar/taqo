'use client';

import { Button, Card, Input } from '@nexa/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signIn, signUp } from '../../lib/auth';

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (isRegister) await signUp(name.trim() || 'Comensal', email, password);
      else await signIn(email, password);
      router.replace('/');
    } catch {
      setError(isRegister ? 'No pudimos crear tu cuenta.' : 'Credenciales inválidas.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}
        </h1>
        <p className="mt-1 font-body text-muted">
          Guarda tu historial y entra más rápido la próxima vez.
        </p>
      </header>

      <Card className="flex flex-col gap-4">
        {isRegister && (
          <label className="flex flex-col gap-1">
            <span className="font-body text-sm text-muted">Nombre</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="font-body text-sm text-muted">Correo</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-sm text-muted">Contraseña</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="font-body text-sm text-error">{error}</p>}

        <Button size="lg" className="w-full" onClick={() => void submit()} disabled={busy}>
          {busy ? 'Un momento…' : isRegister ? 'Crear cuenta' : 'Entrar'}
        </Button>
        <button
          type="button"
          onClick={() => setMode(isRegister ? 'login' : 'register')}
          className="font-body text-sm text-primary-dark"
        >
          {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : 'Crear una cuenta nueva'}
        </button>
      </Card>

      <Link href="/" className="text-center font-body text-sm text-muted">
        Continuar como invitado
      </Link>
    </main>
  );
}
