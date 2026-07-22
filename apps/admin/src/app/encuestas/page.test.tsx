import type { Survey, SurveyQuestion } from '@nexa/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAdmin, type Routes } from '../../testing/harness';
import SurveysPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/encuestas',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function question(overrides: Partial<SurveyQuestion> = {}): SurveyQuestion {
  return {
    id: 'q1',
    type: 'rating',
    label: 'Califica tu visita',
    helpText: null,
    required: false,
    position: 0,
    config: { maxRating: 5 },
    ...overrides,
  };
}

function survey(overrides: Partial<Survey> = {}): Survey {
  return {
    id: 'survey-1',
    ownerRef: 'rest-1',
    purpose: 'feedback',
    title: '¿Cómo estuvo tu visita?',
    description: null,
    status: 'draft',
    version: 1,
    createdAt: '2026-07-21T00:00:00.000Z',
    questions: [question()],
    ...overrides,
  };
}

function open(routes: Routes = {}) {
  return renderAdmin(<SurveysPage />, {
    'GET /restaurants/DEMO/surveys': { surveys: [survey()] },
    ...routes,
  });
}

/** The builder's middle column, so palette buttons never match by accident. */
function questionList() {
  return screen.getByRole('list');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('surveys page', () => {
  it('loads the restaurant surveys', async () => {
    open();

    expect(await screen.findByText('Califica tu visita')).toBeInTheDocument();
  });

  it('offers to create one when the restaurant has none', async () => {
    open({ 'GET /restaurants/DEMO/surveys': { surveys: [] } });

    expect(await screen.findByRole('button', { name: 'Crear encuesta' })).toBeInTheDocument();
  });

  it('creates a survey for the purpose being viewed', async () => {
    const harness = open({
      'GET /restaurants/DEMO/surveys': { surveys: [] },
      'POST /restaurants/DEMO/surveys': { survey: survey({ questions: [] }) },
    });
    await screen.findByRole('button', { name: 'Crear encuesta' });

    await userEvent.click(screen.getByRole('button', { name: 'Crear encuesta' }));

    await waitFor(() => {
      const call = harness.calls.find((c) => c.method === 'POST');
      expect(call?.body).toMatchObject({ purpose: 'feedback' });
    });
  });

  describe('the question palette', () => {
    it('adds a question of the type that was tapped', async () => {
      open();
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Nota / comentario' }));

      expect(within(questionList()).getByText(/Nota \/ comentario/)).toBeInTheDocument();
    });

    it('adds to the end, not the start', async () => {
      open();
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Sí / No' }));

      const rows = within(questionList()).getAllByRole('listitem');
      expect(rows[0]).toHaveTextContent('Califica tu visita');
      expect(rows[1]).toHaveTextContent('Sí / No');
    });

    it('selects the new question so it can be written immediately', async () => {
      open();
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Texto corto' }));

      expect(screen.queryByText('Selecciona una pregunta para editarla.')).not.toBeInTheDocument();
    });
  });

  describe('saving', () => {
    it('is blocked while a question has no text', async () => {
      open();
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Texto corto' }));

      expect(screen.getByRole('button', { name: 'Guardar preguntas' })).toBeDisabled();
      expect(screen.getAllByText('Escribe el texto de la pregunta.').length).toBeGreaterThan(0);
    });

    it('is allowed once the question has text', async () => {
      open();
      await screen.findByText('Califica tu visita');
      await userEvent.click(screen.getByRole('button', { name: 'Texto corto' }));

      await userEvent.type(screen.getByLabelText('Texto de la pregunta'), '¿Tu nombre?');

      expect(screen.getByRole('button', { name: 'Guardar preguntas' })).toBeEnabled();
    });

    it('sends the questions without the client-side key', async () => {
      // `key` is a React handle; the server rejects unknown fields.
      const harness = open({
        'PUT /restaurants/DEMO/surveys/feedback/questions': { survey: survey() },
      });
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar preguntas' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PUT');
        expect(call).toBeDefined();
        const sent = (call?.body as { questions: unknown[] }).questions[0];
        expect(sent).not.toHaveProperty('key');
        expect(sent).toMatchObject({ id: 'q1', type: 'rating', label: 'Califica tu visita' });
      });
    });

    it('explains a version bump, since it changes how old answers read', async () => {
      open({
        'PUT /restaurants/DEMO/surveys/feedback/questions': {
          survey: survey({ version: 2 }),
        },
      });
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar preguntas' }));

      expect(await screen.findByText(/pasó a la versión 2/)).toBeInTheDocument();
    });

    it('stays quiet about the version when nothing meaningful changed', async () => {
      open({
        'PUT /restaurants/DEMO/surveys/feedback/questions': { survey: survey({ version: 1 }) },
      });
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar preguntas' }));

      expect(await screen.findByText('Guardado.')).toBeInTheDocument();
    });

    it('reports a rejected save rather than looking saved', async () => {
      open({
        'PUT /restaurants/DEMO/surveys/feedback/questions': new Error('La encuesta está cerrada'),
      });
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar preguntas' }));

      expect(await screen.findByText(/La encuesta está cerrada/)).toBeInTheDocument();
    });
  });

  describe('properties', () => {
    it('edits the text of the selected question', async () => {
      open();
      await userEvent.click(await screen.findByText('Califica tu visita'));

      const field = screen.getByLabelText('Texto de la pregunta');
      await userEvent.clear(field);
      await userEvent.type(field, 'Nueva pregunta');

      expect(within(questionList()).getByText('Nueva pregunta')).toBeInTheDocument();
    });

    it('removes the selected question', async () => {
      open();
      await userEvent.click(await screen.findByText('Califica tu visita'));

      await userEvent.click(screen.getByRole('button', { name: /Eliminar/ }));

      expect(screen.getByText('Sin preguntas todavía')).toBeInTheDocument();
    });
  });

  describe('lifecycle', () => {
    it('publishes a draft', async () => {
      const harness = open({
        'POST /restaurants/DEMO/surveys/feedback/publish': {
          survey: survey({ status: 'active' }),
        },
        'GET /restaurants/DEMO/surveys/feedback/stats': { stats: { responses: 0, questions: [] } },
      });
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

      await waitFor(() =>
        expect(
          harness.calls.some((c) => c.path === '/restaurants/DEMO/surveys/feedback/publish'),
        ).toBe(true),
      );
      expect(await screen.findByText('Encuesta publicada.')).toBeInTheDocument();
    });

    it('offers to close an active survey, not to publish it again', async () => {
      open({
        'GET /restaurants/DEMO/surveys': { surveys: [survey({ status: 'active' })] },
        'GET /restaurants/DEMO/surveys/feedback/stats': { stats: { responses: 0, questions: [] } },
      });

      expect(await screen.findByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
    });

    it('promises the responses survive being closed', async () => {
      open({
        'GET /restaurants/DEMO/surveys': { surveys: [survey({ status: 'active' })] },
        'GET /restaurants/DEMO/surveys/feedback/stats': { stats: { responses: 0, questions: [] } },
        'POST /restaurants/DEMO/surveys/feedback/close': { survey: survey({ status: 'closed' }) },
      });
      await screen.findByRole('button', { name: 'Cerrar' });

      await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

      expect(await screen.findByText(/Las respuestas se conservan/)).toBeInTheDocument();
    });
  });

  describe('purposes', () => {
    it('shows the intake survey when that tab is chosen', async () => {
      open({
        'GET /restaurants/DEMO/surveys': {
          surveys: [
            survey(),
            survey({
              id: 'survey-2',
              purpose: 'intake',
              questions: [question({ id: 'q2', label: '¿Alguna alergia?' })],
            }),
          ],
        },
      });
      await screen.findByText('Califica tu visita');

      await userEvent.click(screen.getByRole('button', { name: 'Formulario de alta' }));

      expect(await screen.findByText('¿Alguna alergia?')).toBeInTheDocument();
    });
  });

  it('does not ask for stats for a draft, which has no responses', async () => {
    const harness = open();
    await screen.findByText('Califica tu visita');

    expect(harness.calls.some((c) => c.path.endsWith('/stats'))).toBe(false);
  });
});
