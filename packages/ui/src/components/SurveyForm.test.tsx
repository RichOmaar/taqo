import type { QuestionType, SurveyQuestion } from '@nexa/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SurveyForm, type SurveyAnswers } from './SurveyForm';

function question(type: QuestionType, overrides: Partial<SurveyQuestion> = {}): SurveyQuestion {
  return {
    id: `q-${type}`,
    type,
    label: `Pregunta ${type}`,
    helpText: null,
    required: false,
    position: 0,
    config: {},
    ...overrides,
  };
}

function Live({ questions }: { questions: SurveyQuestion[] }) {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  return (
    <>
      <SurveyForm
        questions={questions}
        answers={answers}
        onChange={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))}
      />
      <output data-testid="answers">{JSON.stringify(answers)}</output>
    </>
  );
}

const answers = () => JSON.parse(screen.getByTestId('answers').textContent || '{}');

describe('SurveyForm', () => {
  it('renders questions in position order, not array order', () => {
    const shuffled = [
      question('short_text', { id: 'b', label: 'Segunda', position: 1 }),
      question('short_text', { id: 'a', label: 'Primera', position: 0 }),
    ];
    render(<SurveyForm questions={shuffled} answers={{}} onChange={vi.fn()} />);

    const labels = screen.getAllByText(/Primera|Segunda/).map((node) => node.textContent);
    expect(labels[0]).toContain('Primera');
  });

  it('marks a required question for sighted and screen-reader users alike', () => {
    // The asterisk is decorative; the word carries the meaning.
    render(
      <SurveyForm
        questions={[question('short_text', { required: true, label: 'Nombre' })]}
        answers={{}}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('(obligatoria)')).toBeInTheDocument();
  });

  it('associates help text with its control', () => {
    render(
      <SurveyForm
        questions={[question('short_text', { label: 'Nombre', helpText: 'Como te llamamos' })]}
        answers={{}}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Como te llamamos');
  });

  it('associates a problem with its control', () => {
    render(
      <SurveyForm
        questions={[question('short_text', { id: 'q1', label: 'Nombre' })]}
        answers={{}}
        onChange={vi.fn()}
        problems={{ q1: 'Esta pregunta es obligatoria' }}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Esta pregunta es obligatoria');
  });

  describe('text', () => {
    it('reports what was typed', async () => {
      render(<Live questions={[question('short_text', { id: 'q1' })]} />);

      await userEvent.type(screen.getByRole('textbox'), 'Ana');

      expect(answers()).toEqual({ q1: 'Ana' });
    });

    it('uses a textarea for a long answer', () => {
      render(<SurveyForm questions={[question('long_text')]} answers={{}} onChange={vi.fn()} />);

      expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
    });
  });

  describe('number', () => {
    it('reports a number, not the input string', async () => {
      // The API validates by type, so "4" would be rejected as text.
      render(<Live questions={[question('number', { id: 'q1' })]} />);

      await userEvent.type(screen.getByRole('spinbutton'), '4');

      expect(answers()).toEqual({ q1: 4 });
    });
  });

  describe('single choice', () => {
    const q = question('single_choice', { id: 'q1', config: { options: ['Terraza', 'Interior'] } });

    it('reports the chosen option', async () => {
      render(<Live questions={[q]} />);

      await userEvent.click(screen.getByRole('button', { name: 'Terraza' }));

      expect(answers()).toEqual({ q1: 'Terraza' });
    });

    it('replaces the choice rather than accumulating', async () => {
      render(<Live questions={[q]} />);

      await userEvent.click(screen.getByRole('button', { name: 'Terraza' }));
      await userEvent.click(screen.getByRole('button', { name: 'Interior' }));

      expect(answers()).toEqual({ q1: 'Interior' });
    });

    it('announces selection through state, not colour alone', () => {
      render(<SurveyForm questions={[q]} answers={{ q1: 'Terraza' }} onChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Terraza' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  describe('multi choice', () => {
    const q = question('multi_choice', {
      id: 'q1',
      config: { options: ['Vegano', 'Sin gluten'] },
    });

    it('accumulates selections', async () => {
      render(<Live questions={[q]} />);

      await userEvent.click(screen.getByRole('button', { name: 'Vegano' }));
      await userEvent.click(screen.getByRole('button', { name: 'Sin gluten' }));

      expect(answers()).toEqual({ q1: ['Vegano', 'Sin gluten'] });
    });

    it('deselects on a second tap', async () => {
      render(<Live questions={[q]} />);

      await userEvent.click(screen.getByRole('button', { name: 'Vegano' }));
      await userEvent.click(screen.getByRole('button', { name: 'Vegano' }));

      expect(answers()).toEqual({ q1: [] });
    });

    it('never repeats a selection, which the API rejects', async () => {
      render(<Live questions={[q]} />);

      await userEvent.click(screen.getByRole('button', { name: 'Vegano' }));
      await userEvent.click(screen.getByRole('button', { name: 'Sin gluten' }));
      await userEvent.click(screen.getByRole('button', { name: 'Vegano' }));
      await userEvent.click(screen.getByRole('button', { name: 'Vegano' }));

      expect(answers().q1).toEqual(['Sin gluten', 'Vegano']);
    });
  });

  describe('rating', () => {
    it('renders the configured scale', () => {
      render(
        <SurveyForm
          questions={[question('rating', { config: { maxRating: 10 } })]}
          answers={{}}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getAllByRole('button')).toHaveLength(10);
    });

    it('reports the chosen star as a number', async () => {
      render(<Live questions={[question('rating', { id: 'q1', config: { maxRating: 5 } })]} />);

      await userEvent.click(screen.getByRole('button', { name: '4 de 5' }));

      expect(answers()).toEqual({ q1: 4 });
    });

    it('labels each star, so it is not shape-only', () => {
      render(
        <SurveyForm
          questions={[question('rating', { config: { maxRating: 5 } })]}
          answers={{}}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: '1 de 5' })).toBeInTheDocument();
    });
  });

  describe('nps', () => {
    it('offers the whole 0 to 10 scale', () => {
      render(<SurveyForm questions={[question('nps')]} answers={{}} onChange={vi.fn()} />);

      expect(screen.getAllByRole('button')).toHaveLength(11);
      expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument();
    });

    it('reports zero, which is a real answer rather than an absent one', async () => {
      render(<Live questions={[question('nps', { id: 'q1' })]} />);

      await userEvent.click(screen.getByRole('button', { name: '0' }));

      expect(answers()).toEqual({ q1: 0 });
    });
  });

  describe('boolean', () => {
    it('reports true and false rather than their labels', async () => {
      render(<Live questions={[question('boolean', { id: 'q1' })]} />);

      await userEvent.click(screen.getByRole('button', { name: 'No' }));

      expect(answers()).toEqual({ q1: false });
    });
  });

  it('disables every control while submitting', () => {
    render(
      <SurveyForm
        questions={[question('short_text'), question('rating', { id: 'q2', position: 1 })]}
        answers={{}}
        onChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(
      true,
    );
  });

  it('renders nothing for a survey with no questions', () => {
    const { container } = render(<SurveyForm questions={[]} answers={{}} onChange={vi.fn()} />);

    expect(container.querySelectorAll('input, button, textarea')).toHaveLength(0);
  });
});
