'use client';

import { isApiRequestError } from '@nexa/api-client';
import type { MembershipCardResponse, Redemption, Reward } from '@nexa/types';
import { Button, Card } from '@nexa/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api, getToken } from '../../lib/nexa';

/**
 * Everything read from the browser, resolved after mount.
 *
 * The page is prerendered, so the server has neither a token nor a query
 * string. Reading them during the first render makes the client disagree with
 * the server HTML and React discards the markup — so the first render matches,
 * and the real values arrive a tick later.
 */
function useBrowserContext(): { code: string; signedIn: boolean } | null {
  const [context, setContext] = useState<{ code: string; signedIn: boolean } | null>(null);

  useEffect(() => {
    setContext({
      code: new URLSearchParams(window.location.search).get('code')?.toUpperCase() ?? 'DEMO',
      signedIn: Boolean(getToken()),
    });
  }, []);

  return context;
}

export default function MembershipPage() {
  const context = useBrowserContext();
  const [data, setData] = useState<MembershipCardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justRedeemed, setJustRedeemed] = useState<Redemption | null>(null);

  const code = context?.code ?? 'DEMO';
  const signedIn = context?.signedIn ?? false;

  useEffect(() => {
    if (!context?.signedIn) return;
    api.myMembership
      .get(context.code)
      .then(setData)
      .catch((cause: unknown) =>
        setError(isApiRequestError(cause) ? cause.message : 'No pudimos cargar tu membresía.'),
      );
  }, [context]);

  // Until the browser context resolves, render what the server rendered.
  if (!context) {
    return (
      <Shell>
        <p className="font-body text-muted">Cargando…</p>
      </Shell>
    );
  }

  async function join() {
    setBusy(true);
    setError(null);
    try {
      await api.myMembership.join(code);
      setData(await api.myMembership.get(code));
    } catch (cause) {
      setError(isApiRequestError(cause) ? cause.message : 'No pudimos inscribirte.');
    } finally {
      setBusy(false);
    }
  }

  async function redeem(reward: Reward) {
    if (!data?.membership) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.myMembership.redeem(data.membership.id, reward.id);
      setJustRedeemed(result.redemption);
      setData(await api.myMembership.get(code));
    } catch (cause) {
      setError(isApiRequestError(cause) ? cause.message : 'No pudimos canjear tu premio.');
    } finally {
      setBusy(false);
    }
  }

  // The conversion moment: a membership needs a durable identity, so a guest
  // is asked to create an account here rather than being turned away.
  if (!signedIn) {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-bold text-foreground">Acumula en cada visita</h1>
        <p className="font-body text-muted">
          Crea tu cuenta para guardar tus visitas y canjear premios. Toma menos de un minuto.
        </p>
        <Link href="/cuenta" className="w-full">
          <Button size="lg" className="w-full">
            Crear mi cuenta
          </Button>
        </Link>
        <Link href="/" className="font-body text-sm text-muted">
          Ahora no
        </Link>
      </Shell>
    );
  }

  if (error && !data) {
    return (
      <Shell>
        <p className="font-body text-error">{error}</p>
        <Link href="/" className="font-body text-sm text-muted">
          Volver
        </Link>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <p className="font-body text-muted">Cargando…</p>
      </Shell>
    );
  }

  if (justRedeemed) {
    return (
      <Shell>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary/15 text-5xl">
          🎁
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">¡Premio canjeado!</h1>
        <p className="font-body text-muted">Muestra este código en el restaurante.</p>
        <p className="rounded-xl bg-foreground px-6 py-4 font-display text-2xl font-bold tracking-widest text-white">
          {justRedeemed.code}
        </p>
        <Button variant="ghost" onClick={() => setJustRedeemed(null)}>
          Volver a mi membresía
        </Button>
      </Shell>
    );
  }

  if (!data.membership || !data.balance) {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-bold text-foreground">{data.program.name}</h1>
        <p className="font-body text-muted">
          Únete y cada visita empieza a contar para tus premios.
        </p>
        <Button size="lg" className="w-full" onClick={() => void join()} disabled={busy}>
          {busy ? 'Un momento…' : 'Unirme'}
        </Button>
        {error && <p className="font-body text-sm text-error">{error}</p>}
      </Shell>
    );
  }

  const { balance, program, rewards } = data;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 py-10">
      <header className="text-center">
        <p className="font-body text-sm text-muted">{program.name}</p>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {balance.tierName ?? 'Socio'}
        </h1>
      </header>

      <Card className="flex flex-col gap-4 text-center">
        <div className="flex justify-around">
          <div>
            <p className="font-display text-3xl font-bold text-primary-dark">{balance.points}</p>
            <p className="font-body text-xs text-muted">puntos</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-primary-dark">{balance.visits}</p>
            <p className="font-body text-xs text-muted">visitas</p>
          </div>
        </div>

        {balance.nextTier ? (
          <p className="font-body text-sm text-muted">
            Te faltan <strong className="text-foreground">{balance.nextTier.remaining}</strong> para{' '}
            {balance.nextTier.name}
          </p>
        ) : (
          <p className="font-body text-sm text-secondary-dark">
            Estás en el nivel más alto. ¡Gracias por volver!
          </p>
        )}
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Premios</h2>

        {rewards.length === 0 && (
          <p className="font-body text-sm text-muted">
            Todavía no hay premios disponibles. Sigue acumulando.
          </p>
        )}

        {rewards.map((reward) => {
          const affordable = balance.points >= reward.costPoints;
          return (
            <Card key={reward.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-foreground">{reward.name}</p>
                <p className="font-body text-xs text-muted">
                  {reward.costPoints} puntos
                  {!affordable && ` · te faltan ${reward.costPoints - balance.points}`}
                </p>
              </div>
              <Button size="sm" disabled={!affordable || busy} onClick={() => void redeem(reward)}>
                Canjear
              </Button>
            </Card>
          );
        })}
      </section>

      {error && <p className="font-body text-sm text-error">{error}</p>}

      <Link href="/" className="text-center font-body text-sm text-muted">
        Volver
      </Link>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-5 py-10 text-center">
      {children}
    </main>
  );
}
