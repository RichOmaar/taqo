import type { Survey } from '@nexa/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SurveyPanel } from './SurveyPanel';

const active = vi.fn();
const submit = vi.fn();

vi.mock('../lib/nexa', () => ({
  api: {
    surveys: {
      active: (...args: unknown[]) => active(...args),
      submit: (...args: unknown[]) => submit(...args),
    },
  },
}));

function survey(overrides: Partial<Survey> = {}): Survey {
  return {
    id: 'survey-1',
    ownerRef: 'rest-1',
    purpose: 'feedback',
    title: '¿Cómo estuvo todo?',
    description: null,
    status: 'active',
    version: 1,
    createdAt: '2026-07-21T00:00:00.000Z',
    questions: [
      {
        id: 'q1',
        type: 'rating',
        label: 'Califica tu visita',
        helpText: null,
        required: true,
        position: 0,
        config: { maxRating: 5 },
      },
      {
        id: 'q2',
        type: 'long_text',
        label: 'Comentarios',
        helpText: null,
        required: false,
        position: 1,
        config: {},
      },
    ],
    ...overrides,
  };
}

function renderPanel(props: Partial<React.ComponentProps<typeof SurveyPanel>> = {}) {
  return render(
    <SurveyPanel code="DEMO" purpose="feedback" subjectRef="entry-1" {...props} />,
  );
}

beforeEach(() => {
  active.mockReset();
  submit.mockReset();
  submit.mockResolvedValue({ response: { id: 'r1' } });
});

describe('SurveyPanel', () => {
  it('renders the published survey', async () => {
    active.mockResolvedValue({ survey: survey() });
    renderPanel();

    expect(await screen.findByText('¿Cómo estuvo todo?')).toBeInTheDocument();
    expect(screen.getByText('Califica tu visita')).toBeInTheDocument();
  });

  it('asks the API for the requested restaurant and purpose', async () => {
    active.mockResolvedValue({ survey: survey() });
    renderPanel({ code: 'OTRO', purpose: 'intake' });

    await waitFor(() => expect(active).toHaveBeenCalledWith('OTRO', 'intake'));
  });

  it('submits the answers against the survey and its subject', async () => {
    active.mockResolvedValue({ survey: survey() });
    renderPanel();
    await screen.findByText('Califica tu visita');

    await userEvent.click(screen.getByRole('button', { name: '4 de 5' }));
    await userEvent.type(screen.getByRole('textbox'), 'Todo excelente');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith('survey-1', 'entry-1', [
        { questionId: 'q1', value: 4 },
        { questionId: 'q2', value: 'Todo excelente' },
      ]),
    );
  });

  it('thanks the diner once the answers are in', async () => {
    active.mockResolvedValue({ survey: survey() });
    renderPanel();
    await screen.findByText('Califica tu visita');

    await userEvent.click(screen.getByRole('button', { name: '5 de 5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText(/Gracias por tu opinión/)).toBeInTheDocument();
  });

  it('blocks submission while a required question is unanswered', async () => {
    active.mockResolvedValue({ survey: survey() });
    renderPanel();
    await screen.findByText('Califica tu visita');

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Esta pregunta es obligatoria.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('drops the complaint as soon as the question is answered', async () => {
    active.mockResolvedValue({ survey: survey() });
    renderPanel();
    await screen.findByText('Califica tu visita');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText('Esta pregunta es obligatoria.');

    await userEvent.click(screen.getByRole('button', { name: '3 de 5' }));

    expect(screen.queryByText('Esta pregunta es obligatoria.')).not.toBeInTheDocument();
  });

  it('keeps the form open after a failed submission, so the answers survive', async () => {
    active.mockResolvedValue({ survey: survey() });
    submit.mockRejectedValue(new Error('network'));
    renderPanel();
    await screen.findByText('Califica tu visita');

    await userEvent.click(screen.getByRole('button', { name: '4 de 5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText(/No pudimos enviar tus respuestas/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4 de 5' })).toHaveAttribute('aria-pressed', 'true');
  });

  describe('when the owner has published no survey', () => {
    it('shows the fallback', async () => {
      active.mockResolvedValue({ survey: null });
      renderPanel({ fallback: <p>Formulario de siempre</p> });

      expect(await screen.findByText('Formulario de siempre')).toBeInTheDocument();
    });

    it('shows the fallback for a survey with no questions', async () => {
      active.mockResolvedValue({ survey: survey({ questions: [] }) });
      renderPanel({ fallback: <p>Formulario de siempre</p> });

      expect(await screen.findByText('Formulario de siempre')).toBeInTheDocument();
    });

    it('shows the fallback when the survey cannot be fetched', async () => {
      // A survey is a bonus; a broken fetch must not cost the diner the review.
      active.mockRejectedValue(new Error('offline'));
      renderPanel({ fallback: <p>Formulario de siempre</p> });

      expect(await screen.findByText('Formulario de siempre')).toBeInTheDocument();
    });
  });

  it('shows nothing at all while loading, rather than flashing the fallback', async () => {
    active.mockReturnValue(new Promise(() => undefined));
    const { container } = renderPanel({ fallback: <p>Formulario de siempre</p> });

    expect(container).toBeEmptyDOMElement();
  });
});
