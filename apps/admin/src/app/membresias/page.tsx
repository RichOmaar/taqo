'use client';

import { isApiRequestError, type ProgramSettings, type TierInput } from '@nexa/api-client';
import { useApi, useSession } from '@nexa/api-client/react';
import {
  ACCRUAL_MODES,
  DOWNGRADE_POLICIES,
  TIER_METRICS,
  TIER_PERIODS,
  type MembershipProgram,
  type MembershipStats,
  type Reward,
} from '@nexa/types';
import { Button, Card, EmptyState, Input, StatCard, Toggle, TopBar } from '@nexa/ui';
import { useEffect, useState } from 'react';

import { AdminShell } from '../../components/admin-shell';
import {
  ACCRUAL_LABELS,
  DEFAULT_SETTINGS,
  DOWNGRADE_LABELS,
  STARTER_TIERS,
  STATUS_LABELS,
  TIER_METRIC_LABELS,
  TIER_PERIOD_LABELS,
  metricUnit,
  repositioned,
  settingsOf,
  tierSchemeProblem,
} from '../../lib/membership-view';

export default function MembershipsPage() {
  return (
    <AdminShell>
      <Memberships />
    </AdminShell>
  );
}

/** Turns a failure into the API's message when it has one. */
function message(cause: unknown, fallback: string): string {
  return isApiRequestError(cause) ? cause.message : fallback;
}

function Memberships() {
  const api = useApi();
  const { restaurant } = useSession();
  const code = restaurant?.code;

  const [program, setProgram] = useState<MembershipProgram | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<MembershipStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    api.membership
      .get(code)
      .then((data) => {
        setProgram(data.program);
        setRewards(data.rewards);
        setLoaded(true);
      })
      .catch((cause: unknown) => {
        setStatus(message(cause, 'No se pudo cargar el programa.'));
        setLoaded(true);
      });
  }, [api, code]);

  // Statistics only mean anything once members exist.
  useEffect(() => {
    if (!code || program?.status !== 'active') return;
    api.membership
      .stats(code)
      .then((data) => setStats(data.stats))
      .catch(() => setStats(null));
  }, [api, code, program?.status]);

  async function createProgram() {
    if (!code) return;
    try {
      const created = await api.membership.create(code, DEFAULT_SETTINGS);
      const withTiers = await api.membership.replaceTiers(code, STARTER_TIERS);
      setProgram(withTiers.program ?? created.program);
      setStatus('Programa creado. Ajusta los niveles y publícalo cuando estés listo.');
    } catch (cause) {
      setStatus(message(cause, 'No se pudo crear el programa.'));
    }
  }

  if (!loaded) return <p className="font-body text-muted">Cargando…</p>;

  if (!program) {
    return (
      <>
        <TopBar title="Membresías" subtitle="Premia a quienes vuelven." />
        <EmptyState
          title="Todavía no tienes un programa"
          description="Crea un club de clientes para que cada visita sume y tus comensales tengan una razón para volver."
          action={<Button onClick={() => void createProgram()}>Crear programa</Button>}
        />
        {status && <p className="mt-4 font-body text-sm text-error">{status}</p>}
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Membresías"
        subtitle={`${program.name} · ${STATUS_LABELS[program.status]}`}
        actions={
          <LifecycleButton
            code={code!}
            program={program}
            onChange={setProgram}
            onStatus={setStatus}
          />
        }
      />

      {status && <p className="mb-4 font-body text-sm text-secondary-dark">{status}</p>}

      <div className="grid gap-4">
        {stats && <StatsPanel stats={stats} />}

        <SettingsPanel code={code!} program={program} onChange={setProgram} onStatus={setStatus} />

        <TiersPanel code={code!} program={program} onChange={setProgram} onStatus={setStatus} />

        <RewardsPanel
          code={code!}
          program={program}
          rewards={rewards}
          onChange={setRewards}
          onStatus={setStatus}
        />
      </div>
    </>
  );
}

interface PanelProps {
  code: string;
  program: MembershipProgram;
  onChange: (program: MembershipProgram) => void;
  onStatus: (message: string) => void;
}

function LifecycleButton({ code, program, onChange, onStatus }: PanelProps) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const isActive = program.status === 'active';

  async function toggle() {
    setBusy(true);
    try {
      const result = isActive
        ? await api.membership.pause(code)
        : await api.membership.publish(code);
      onChange(result.program);
      onStatus(isActive ? 'Programa pausado. Los saldos se conservan.' : 'Programa publicado.');
    } catch (cause) {
      onStatus(message(cause, 'No se pudo cambiar el estado.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={isActive ? 'secondary' : 'primary'}
      onClick={() => void toggle()}
      disabled={busy}
    >
      {isActive ? 'Pausar' : 'Publicar'}
    </Button>
  );
}

function StatsPanel({ stats }: { stats: MembershipStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Socios" value={String(stats.totalMembers)} />
      <StatCard
        label="Socios activos"
        value={String(stats.activeMembers)}
        hint={stats.totalMembers === 0 ? 'Sin socios aún' : undefined}
      />
      <StatCard
        label="Visitas por socio"
        value={String(stats.visitsPerMember)}
        hint={stats.activeMembers === 0 ? 'Sin datos aún' : undefined}
      />
      <StatCard
        label="Premios canjeados"
        value={`${stats.redemptionsRedeemed} / ${stats.redemptionsIssued}`}
        hint={stats.redemptionsIssued === 0 ? 'Sin canjes aún' : undefined}
      />
    </div>
  );
}

function SettingsPanel({ code, program, onChange, onStatus }: PanelProps) {
  const api = useApi();
  const [draft, setDraft] = useState<ProgramSettings>(() => settingsOf(program));
  const [busy, setBusy] = useState(false);

  const earnsPoints = draft.accrualMode === 'points' || draft.accrualMode === 'both';

  function set<K extends keyof ProgramSettings>(key: K, value: ProgramSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setBusy(true);
    try {
      const result = await api.membership.update(code, draft);
      onChange(result.program);
      onStatus('Configuración guardada.');
    } catch (cause) {
      onStatus(message(cause, 'No se pudo guardar la configuración.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-foreground">Cómo se acumula</h2>

      <label className="flex flex-col gap-1">
        <span className="font-body text-sm text-muted">Nombre del programa</span>
        <Input value={draft.name} onChange={(event) => set('name', event.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Choice
          label="Cada visita otorga"
          value={draft.accrualMode}
          options={ACCRUAL_MODES}
          labels={ACCRUAL_LABELS}
          onChange={(value) => set('accrualMode', value)}
        />

        {earnsPoints && (
          <label className="flex flex-col gap-1">
            <span className="font-body text-sm text-muted">Puntos por visita</span>
            <Input
              type="number"
              min={1}
              value={draft.pointsPerVisit}
              onChange={(event) => set('pointsPerVisit', Number(event.target.value))}
            />
          </label>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Choice
          label="Los niveles se miden en"
          value={draft.tierMetric}
          options={TIER_METRICS}
          labels={TIER_METRIC_LABELS}
          onChange={(value) => set('tierMetric', value)}
        />
        <Choice
          label="Periodo que cuenta"
          value={draft.tierPeriod}
          options={TIER_PERIODS}
          labels={TIER_PERIOD_LABELS}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              tierPeriod: value,
              // A rolling period is meaningless without a window; offer a year
              // rather than letting the owner submit an invalid programme.
              tierWindowDays: value === 'rolling' ? (current.tierWindowDays ?? 365) : null,
            }))
          }
        />
      </div>

      {draft.tierPeriod === 'rolling' && (
        <label className="flex flex-col gap-1">
          <span className="font-body text-sm text-muted">Ventana (días)</span>
          <Input
            type="number"
            min={1}
            value={draft.tierWindowDays ?? 365}
            onChange={(event) => set('tierWindowDays', Number(event.target.value))}
          />
        </label>
      )}

      <Choice
        label="Si un socio deja de venir"
        value={draft.downgradePolicy}
        options={DOWNGRADE_POLICIES}
        labels={DOWNGRADE_LABELS}
        onChange={(value) => set('downgradePolicy', value)}
      />

      <Button className="self-start" onClick={() => void save()} disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </Card>
  );
}

/** Pill-style single choice; the option sets here are short and fixed. */
function Choice<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-body text-sm text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className={
              option === value
                ? 'rounded-full border border-primary bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground'
                : 'rounded-full border border-border bg-surface px-4 py-2 font-body text-sm font-semibold text-foreground hover:bg-black/5'
            }
          >
            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

function TiersPanel({ code, program, onChange, onStatus }: PanelProps) {
  const api = useApi();
  const [tiers, setTiers] = useState<TierInput[]>(() =>
    program.tiers.map((tier) => ({
      name: tier.name,
      threshold: tier.threshold,
      benefits: tier.benefits,
      position: tier.position,
    })),
  );
  const [busy, setBusy] = useState(false);

  const problem = tierSchemeProblem(tiers);
  const unit = metricUnit(program.tierMetric);

  function edit(index: number, patch: Partial<TierInput>) {
    setTiers((current) => current.map((tier, at) => (at === index ? { ...tier, ...patch } : tier)));
  }

  async function save() {
    setBusy(true);
    try {
      const result = await api.membership.replaceTiers(code, tiers);
      onChange(result.program);
      onStatus('Niveles guardados.');
    } catch (cause) {
      onStatus(message(cause, 'No se pudieron guardar los niveles.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-foreground">Niveles</h2>
        <span className="font-body text-xs text-muted">
          Cada nivel debe pedir más {unit} que el anterior
        </span>
      </div>

      {tiers.length === 0 && (
        <p className="font-body text-sm text-muted">
          Agrega al menos un nivel para poder publicar el programa.
        </p>
      )}

      {tiers.map((tier, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-muted">Nombre</span>
            <Input
              value={tier.name}
              onChange={(event) => edit(index, { name: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-muted">Desde ({unit})</span>
            <Input
              type="number"
              min={0}
              className="sm:w-32"
              value={tier.threshold}
              onChange={(event) => edit(index, { threshold: Number(event.target.value) })}
            />
          </label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setTiers((current) => repositioned(current.filter((_, at) => at !== index)))
            }
          >
            Quitar
          </Button>
        </div>
      ))}

      {problem && <p className="font-body text-sm text-error">{problem}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            setTiers((current) =>
              repositioned([
                ...current,
                { name: '', threshold: 0, benefits: [], position: current.length },
              ]),
            )
          }
        >
          + Agregar nivel
        </Button>
        <Button size="sm" onClick={() => void save()} disabled={busy || problem !== null}>
          {busy ? 'Guardando…' : 'Guardar niveles'}
        </Button>
      </div>
    </Card>
  );
}

function RewardsPanel({
  code,
  program,
  rewards,
  onChange,
  onStatus,
}: {
  code: string;
  program: MembershipProgram;
  rewards: Reward[];
  onChange: (rewards: Reward[]) => void;
  onStatus: (message: string) => void;
}) {
  const api = useApi();
  const [name, setName] = useState('');
  const [cost, setCost] = useState(30);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const result = await api.membership.createReward(code, {
        name: name.trim(),
        description: null,
        costPoints: cost,
        minTierPosition: null,
        limitPerMember: null,
        isActive: true,
      });
      onChange([...rewards, result.reward]);
      setName('');
      onStatus('Premio agregado.');
    } catch (cause) {
      onStatus(message(cause, 'No se pudo agregar el premio.'));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(reward: Reward, isActive: boolean) {
    try {
      const result = await api.membership.updateReward(code, reward.id, { isActive });
      onChange(rewards.map((item) => (item.id === reward.id ? result.reward : item)));
    } catch (cause) {
      onStatus(message(cause, 'No se pudo actualizar el premio.'));
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-foreground">Premios</h2>

      {rewards.length === 0 ? (
        <p className="font-body text-sm text-muted">
          Sin premios todavía. Los socios acumulan {metricUnit(program.tierMetric)}, pero aún no
          tienen en qué gastarlos.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rewards.map((reward) => (
            <li key={reward.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-body text-sm font-semibold text-foreground">{reward.name}</p>
                <p className="font-body text-xs text-muted">{reward.costPoints} puntos</p>
              </div>
              <Toggle
                checked={reward.isActive}
                onChange={(checked) => void toggle(reward, checked)}
                label="Disponible"
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="font-body text-xs text-muted">Nuevo premio</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Postre de cortesía"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-muted">Puntos</span>
          <Input
            type="number"
            min={0}
            className="w-28"
            value={cost}
            onChange={(event) => setCost(Number(event.target.value))}
          />
        </label>
        <Button size="sm" onClick={() => void add()} disabled={busy || !name.trim()}>
          Agregar
        </Button>
      </div>
    </Card>
  );
}
