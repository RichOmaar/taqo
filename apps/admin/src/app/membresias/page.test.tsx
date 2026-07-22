import type {
  GetMembershipProgramResponse,
  MembershipProgram,
  MembershipProgramResponse,
  MembershipStats,
  MembershipStatsResponse,
  MembershipTier,
  Reward,
  RewardResponse,
} from '@nexa/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAdmin, type Routes } from '../../testing/harness';
import MembershipsPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/membresias',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const TIERS: MembershipTier[] = [
  { id: 'tier-1', name: 'Bronce', threshold: 0, benefits: ['Acumula visitas'], position: 0 },
  { id: 'tier-2', name: 'Plata', threshold: 5, benefits: ['Postre de cortesía'], position: 1 },
  { id: 'tier-3', name: 'Oro', threshold: 15, benefits: ['Acceso a cola VIP'], position: 2 },
];

function program(overrides: Partial<MembershipProgram> = {}): MembershipProgram {
  return {
    id: 'program-1',
    ownerRef: 'rest-1',
    name: 'Club de clientes',
    status: 'draft',
    accrualMode: 'both',
    pointsPerVisit: 10,
    tierMetric: 'visits',
    tierPeriod: 'lifetime',
    tierWindowDays: null,
    downgradePolicy: 'never',
    tiers: TIERS,
    version: 1,
    createdAt: '2026-07-21T00:00:00.000Z',
    ...overrides,
  };
}

function reward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: 'reward-1',
    programId: 'program-1',
    name: 'Postre de cortesía',
    description: null,
    costPoints: 30,
    minTierPosition: null,
    limitPerMember: null,
    isActive: true,
    ...overrides,
  };
}

function stats(overrides: Partial<MembershipStats> = {}): MembershipStats {
  return {
    totalMembers: 42,
    activeMembers: 18,
    tierDistribution: [{ tierId: 'tier-1', tierName: 'Bronce', members: 30 }],
    redemptionsIssued: 12,
    redemptionsRedeemed: 7,
    visitsPerMember: 3,
    ...overrides,
  };
}

function open(routes: Routes = {}) {
  const body: GetMembershipProgramResponse = { program: program(), rewards: [] };
  return renderAdmin(<MembershipsPage />, {
    'GET /restaurants/DEMO/membership': body,
    ...routes,
  });
}

/** An active programme always pulls its stats, so every route it needs is here. */
function openActive(routes: Routes = {}) {
  const body: GetMembershipProgramResponse = {
    program: program({ status: 'active' }),
    rewards: [],
  };
  const statsBody: MembershipStatsResponse = { stats: stats() };
  return open({
    'GET /restaurants/DEMO/membership': body,
    'GET /restaurants/DEMO/membership/stats': statsBody,
    ...routes,
  });
}

/** The row for one level, so the three name fields never match each other. */
function tierRow(name: string): HTMLElement {
  return screen.getByDisplayValue(name).closest('div')!;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('memberships page', () => {
  describe('when there is no programme yet', () => {
    const none: GetMembershipProgramResponse = { program: null, rewards: [] };

    it('creates the programme with the default settings', async () => {
      const created: MembershipProgramResponse = { program: program() };
      const harness = open({
        'GET /restaurants/DEMO/membership': none,
        'POST /restaurants/DEMO/membership': created,
        'PUT /restaurants/DEMO/membership/tiers': created,
      });
      await screen.findByRole('button', { name: 'Crear programa' });

      await userEvent.click(screen.getByRole('button', { name: 'Crear programa' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'POST');
        expect(call?.body).toMatchObject({
          name: 'Club de clientes',
          accrualMode: 'both',
          pointsPerVisit: 10,
          tierMetric: 'visits',
          tierPeriod: 'lifetime',
          downgradePolicy: 'never',
        });
      });
    });

    it('gives the new programme starter levels, since one with none cannot be published', async () => {
      const created: MembershipProgramResponse = { program: program() };
      const harness = open({
        'GET /restaurants/DEMO/membership': none,
        'POST /restaurants/DEMO/membership': created,
        'PUT /restaurants/DEMO/membership/tiers': created,
      });
      await screen.findByRole('button', { name: 'Crear programa' });

      await userEvent.click(screen.getByRole('button', { name: 'Crear programa' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PUT');
        const sent = (call?.body as { tiers: MembershipTier[] } | undefined)?.tiers;
        expect(sent?.map((tier) => tier.name)).toEqual(['Bronce', 'Plata', 'Oro']);
      });
    });

    it('reports a rejected creation rather than showing an empty programme', async () => {
      open({
        'GET /restaurants/DEMO/membership': none,
        'POST /restaurants/DEMO/membership': new Error('El plan no incluye membresías'),
      });
      await screen.findByRole('button', { name: 'Crear programa' });

      await userEvent.click(screen.getByRole('button', { name: 'Crear programa' }));

      expect(await screen.findByText(/El plan no incluye membresías/)).toBeInTheDocument();
    });

    it('says the programme could not be loaded rather than failing silently', async () => {
      open({ 'GET /restaurants/DEMO/membership': new Error('Sesión expirada') });

      expect(await screen.findByText(/Sesión expirada/)).toBeInTheDocument();
    });

    it('does not claim there is no programme when the load simply failed', async () => {
      // The two are different statements, and only one of them is knowable
      // after a failed request.
      open({ 'GET /restaurants/DEMO/membership': new Error('Sesión expirada') });
      await screen.findByText(/Sesión expirada/);

      expect(screen.queryByText('Todavía no tienes un programa')).not.toBeInTheDocument();
    });

    it('does not offer to create one after a failed load, which could duplicate it', async () => {
      open({ 'GET /restaurants/DEMO/membership': new Error('Sesión expirada') });
      await screen.findByText(/Sesión expirada/);

      expect(screen.queryByRole('button', { name: 'Crear programa' })).not.toBeInTheDocument();
    });

    it('offers a retry instead', async () => {
      const harness = open({ 'GET /restaurants/DEMO/membership': new Error('Sesión expirada') });
      await screen.findByText(/Sesión expirada/);

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

      await waitFor(() =>
        expect(
          harness.calls.filter((c) => c.path === '/restaurants/DEMO/membership').length,
        ).toBeGreaterThan(1),
      );
    });

    it('recovers once the retry succeeds', async () => {
      const harness = open({ 'GET /restaurants/DEMO/membership': new Error('Sesión expirada') });
      await screen.findByText(/Sesión expirada/);

      harness.setRoutes({
        'GET /restaurants/DEMO/membership': { program: program(), rewards: [] },
      });
      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

      expect(await screen.findByDisplayValue('Club de clientes')).toBeInTheDocument();
    });
  });

  describe('statistics', () => {
    it('does not ask for stats for a draft, which has no members', async () => {
      const harness = open();
      await screen.findByDisplayValue('Club de clientes');

      expect(harness.calls.some((c) => c.path.endsWith('/stats'))).toBe(false);
    });

    it('shows the member count once the programme is active', async () => {
      openActive();

      expect(await screen.findByText('42')).toBeInTheDocument();
    });

    it('shows redemptions against the number issued, not on their own', async () => {
      openActive();

      expect(await screen.findByText('7 / 12')).toBeInTheDocument();
    });

    it('hides the visit average while no member has been active, as it means nothing', async () => {
      const statsBody: MembershipStatsResponse = { stats: stats({ activeMembers: 0 }) };
      openActive({ 'GET /restaurants/DEMO/membership/stats': statsBody });

      expect(await screen.findByText('Sin datos aún')).toBeInTheDocument();
    });
  });

  describe('how points accrue', () => {
    it('sends the edited programme name', async () => {
      const saved: MembershipProgramResponse = { program: program({ name: 'Club Nexa' }) };
      const harness = open({ 'PATCH /restaurants/DEMO/membership': saved });
      const name = await screen.findByLabelText('Nombre del programa');

      await userEvent.clear(name);
      await userEvent.type(name, 'Club Nexa');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PATCH');
        expect(call?.body).toMatchObject({ name: 'Club Nexa' });
      });
    });

    it('shows the saved programme name in the heading', async () => {
      const saved: MembershipProgramResponse = { program: program({ name: 'Club Nexa' }) };
      open({ 'PATCH /restaurants/DEMO/membership': saved });
      await screen.findByLabelText('Nombre del programa');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      expect(await screen.findByText('Club Nexa · Borrador')).toBeInTheDocument();
    });

    it('drops the points field when only visits accrue', async () => {
      open();
      await screen.findByLabelText('Puntos por visita');

      await userEvent.click(screen.getByRole('button', { name: 'Solo visitas' }));

      expect(screen.queryByLabelText('Puntos por visita')).not.toBeInTheDocument();
    });

    it('sends a year-long window when the period becomes rolling', async () => {
      // A rolling period with no window is not a programme the server accepts.
      const saved: MembershipProgramResponse = { program: program() };
      const harness = open({ 'PATCH /restaurants/DEMO/membership': saved });
      await screen.findByLabelText('Nombre del programa');

      await userEvent.click(screen.getByRole('button', { name: 'Ventana móvil' }));
      await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PATCH');
        expect(call?.body).toMatchObject({ tierPeriod: 'rolling', tierWindowDays: 365 });
      });
    });

    it('clears the window when the period goes back to lifetime', async () => {
      const rolling: GetMembershipProgramResponse = {
        program: program({ tierPeriod: 'rolling', tierWindowDays: 90 }),
        rewards: [],
      };
      const saved: MembershipProgramResponse = { program: program() };
      const harness = open({
        'GET /restaurants/DEMO/membership': rolling,
        'PATCH /restaurants/DEMO/membership': saved,
      });
      await screen.findByLabelText('Ventana (días)');

      await userEvent.click(screen.getByRole('button', { name: 'De por vida' }));
      await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PATCH');
        expect(call?.body).toMatchObject({ tierPeriod: 'lifetime', tierWindowDays: null });
      });
    });

    it('reports a rejected save rather than claiming the settings were stored', async () => {
      open({ 'PATCH /restaurants/DEMO/membership': new Error('La ventana debe ser positiva') });
      await screen.findByLabelText('Nombre del programa');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      expect(await screen.findByText(/La ventana debe ser positiva/)).toBeInTheDocument();
    });
  });

  describe('levels', () => {
    it('labels the threshold in the unit the programme counts', async () => {
      const points: GetMembershipProgramResponse = {
        program: program({ tierMetric: 'points' }),
        rewards: [],
      };
      open({ 'GET /restaurants/DEMO/membership': points });

      expect(await screen.findAllByLabelText('Desde (puntos)')).toHaveLength(3);
    });

    it('blocks saving a scheme whose thresholds stop rising', async () => {
      open();
      const oro = await screen.findByDisplayValue('15');

      await userEvent.clear(oro);
      await userEvent.type(oro, '5');

      expect(screen.getByRole('button', { name: 'Guardar niveles' })).toBeDisabled();
    });

    it('names the two levels that clash, so the owner knows which to fix', async () => {
      open();
      const oro = await screen.findByDisplayValue('15');

      await userEvent.clear(oro);
      await userEvent.type(oro, '5');

      expect(screen.getByText(/"Oro" debe pedir más que "Plata"/)).toBeInTheDocument();
    });

    it('blocks saving until a newly added level is named', async () => {
      open();
      await screen.findByDisplayValue('Bronce');

      await userEvent.click(screen.getByRole('button', { name: '+ Agregar nivel' }));

      expect(screen.getByRole('button', { name: 'Guardar niveles' })).toBeDisabled();
      expect(screen.getByText('Cada nivel necesita un nombre.')).toBeInTheDocument();
    });

    it('renumbers the levels that remain after one is removed', async () => {
      const saved: MembershipProgramResponse = { program: program() };
      const harness = open({ 'PUT /restaurants/DEMO/membership/tiers': saved });
      await screen.findByDisplayValue('Plata');

      await userEvent.click(within(tierRow('Plata')).getByRole('button', { name: 'Quitar' }));
      await userEvent.click(screen.getByRole('button', { name: 'Guardar niveles' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PUT');
        const sent = (call?.body as { tiers: MembershipTier[] } | undefined)?.tiers;
        expect(sent?.map((tier) => [tier.name, tier.position])).toEqual([
          ['Bronce', 0],
          ['Oro', 1],
        ]);
      });
    });

    it('sends an edited threshold', async () => {
      const saved: MembershipProgramResponse = { program: program() };
      const harness = open({ 'PUT /restaurants/DEMO/membership/tiers': saved });
      const oro = await screen.findByDisplayValue('15');

      await userEvent.clear(oro);
      await userEvent.type(oro, '20');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar niveles' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PUT');
        const sent = (call?.body as { tiers: MembershipTier[] } | undefined)?.tiers;
        expect(sent?.[2]).toMatchObject({ name: 'Oro', threshold: 20 });
      });
    });

    it('reports levels the server rejected, even though the form allowed them', async () => {
      open({
        'PUT /restaurants/DEMO/membership/tiers': new Error(
          'El nivel de entrada debe empezar en 0',
        ),
      });
      await screen.findByDisplayValue('Bronce');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar niveles' }));

      expect(await screen.findByText(/El nivel de entrada debe empezar en 0/)).toBeInTheDocument();
    });
  });

  describe('rewards', () => {
    const withReward: GetMembershipProgramResponse = { program: program(), rewards: [reward()] };

    it('sends the trimmed reward name', async () => {
      const created: RewardResponse = { reward: reward({ id: 'reward-2', name: 'Café' }) };
      const harness = open({ 'POST /restaurants/DEMO/membership/rewards': created });
      await screen.findByLabelText('Nuevo premio');

      await userEvent.type(screen.getByLabelText('Nuevo premio'), '  Café  ');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.path.endsWith('/rewards'));
        expect(call?.body).toMatchObject({ name: 'Café', costPoints: 30, isActive: true });
      });
    });

    it('shows the new reward without a reload', async () => {
      const created: RewardResponse = { reward: reward({ id: 'reward-2', name: 'Café' }) };
      open({ 'POST /restaurants/DEMO/membership/rewards': created });
      await screen.findByLabelText('Nuevo premio');

      await userEvent.type(screen.getByLabelText('Nuevo premio'), 'Café');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      expect(await screen.findByText('Café')).toBeInTheDocument();
    });

    it('clears the field, so the next reward starts from empty', async () => {
      const created: RewardResponse = { reward: reward({ id: 'reward-2', name: 'Café' }) };
      open({ 'POST /restaurants/DEMO/membership/rewards': created });
      await screen.findByLabelText('Nuevo premio');

      await userEvent.type(screen.getByLabelText('Nuevo premio'), 'Café');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => expect(screen.getByLabelText('Nuevo premio')).toHaveValue(''));
    });

    it('will not add a reward with a blank name', async () => {
      open();
      await screen.findByLabelText('Nuevo premio');

      await userEvent.type(screen.getByLabelText('Nuevo premio'), '   ');

      expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
    });

    it('sends the cost in points the owner typed', async () => {
      const created: RewardResponse = { reward: reward({ id: 'reward-2', name: 'Café' }) };
      const harness = open({ 'POST /restaurants/DEMO/membership/rewards': created });
      await screen.findByLabelText('Nuevo premio');

      await userEvent.type(screen.getByLabelText('Nuevo premio'), 'Café');
      const cost = screen.getByLabelText('Puntos');
      await userEvent.clear(cost);
      await userEvent.type(cost, '50');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.path.endsWith('/rewards'));
        expect(call?.body).toMatchObject({ costPoints: 50 });
      });
    });

    it('takes a reward out of circulation without deleting it', async () => {
      const updated: RewardResponse = { reward: reward({ isActive: false }) };
      const harness = open({
        'GET /restaurants/DEMO/membership': withReward,
        'PATCH /restaurants/DEMO/membership/rewards/reward-1': updated,
      });
      await screen.findByText('Postre de cortesía');

      await userEvent.click(screen.getByRole('switch', { name: 'Disponible' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PATCH');
        expect(call?.body).toEqual({ isActive: false });
      });
    });

    it('switches the reward that was tapped, not the first one', async () => {
      const two: GetMembershipProgramResponse = {
        program: program(),
        rewards: [reward(), reward({ id: 'reward-2', name: 'Café' })],
      };
      const updated: RewardResponse = { reward: reward({ id: 'reward-2', isActive: false }) };
      const harness = open({
        'GET /restaurants/DEMO/membership': two,
        'PATCH /restaurants/DEMO/membership/rewards/reward-2': updated,
      });
      await screen.findByText('Café');

      const rows = screen.getAllByRole('listitem');
      await userEvent.click(within(rows[1]!).getByRole('switch', { name: 'Disponible' }));

      await waitFor(() =>
        expect(
          harness.calls.some((c) => c.path === '/restaurants/DEMO/membership/rewards/reward-2'),
        ).toBe(true),
      );
    });

    it('reports a rejected switch rather than showing the reward as changed', async () => {
      open({
        'GET /restaurants/DEMO/membership': withReward,
        'PATCH /restaurants/DEMO/membership/rewards/reward-1': new Error('Premio en uso'),
      });
      await screen.findByText('Postre de cortesía');

      await userEvent.click(screen.getByRole('switch', { name: 'Disponible' }));

      expect(await screen.findByText(/Premio en uso/)).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'Disponible' })).toBeChecked();
    });
  });

  describe('lifecycle', () => {
    it('publishes a draft', async () => {
      const published: MembershipProgramResponse = { program: program({ status: 'active' }) };
      const statsBody: MembershipStatsResponse = { stats: stats() };
      const harness = open({
        'POST /restaurants/DEMO/membership/publish': published,
        'GET /restaurants/DEMO/membership/stats': statsBody,
      });
      await screen.findByDisplayValue('Club de clientes');

      await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

      await waitFor(() =>
        expect(harness.calls.some((c) => c.path === '/restaurants/DEMO/membership/publish')).toBe(
          true,
        ),
      );
      expect(await screen.findByText('Programa publicado.')).toBeInTheDocument();
    });

    it('offers to pause an active programme, not to publish it again', async () => {
      openActive();

      expect(await screen.findByRole('button', { name: 'Pausar' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
    });

    it('promises the balances survive a pause', async () => {
      const paused: MembershipProgramResponse = { program: program({ status: 'paused' }) };
      openActive({ 'POST /restaurants/DEMO/membership/pause': paused });
      await screen.findByRole('button', { name: 'Pausar' });

      await userEvent.click(screen.getByRole('button', { name: 'Pausar' }));

      expect(await screen.findByText(/Los saldos se conservan/)).toBeInTheDocument();
    });

    it('keeps the programme a draft when publishing is rejected', async () => {
      open({
        'POST /restaurants/DEMO/membership/publish': new Error('Agrega al menos un premio'),
      });
      await screen.findByDisplayValue('Club de clientes');

      await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

      expect(await screen.findByText(/Agrega al menos un premio/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument();
    });
  });
});
