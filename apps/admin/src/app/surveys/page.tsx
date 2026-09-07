'use client';

import { isApiRequestError } from '@nexa/api-client';
import { useApi, useSession } from '@nexa/api-client/react';
import {
  QUESTION_TYPES,
  type QuestionType,
  type Survey,
  type SurveyPurpose,
  type SurveyStats,
} from '@nexa/types';
import { Button, Card, EmptyState, Input, SortableList, Toggle, TopBar } from '@nexa/ui';
import { useEffect, useState } from 'react';

import { AdminShell } from '../../components/admin-shell';
import {
  CHOICE_TYPES,
  QUESTION_LABELS,
  definitionProblem,
  newQuestion,
  questionProblem,
  repositioned,
  toDrafts,
  type QuestionDraft,
} from '../../lib/survey-view';

const PURPOSE_LABELS: Record<SurveyPurpose, string> = {
  intake: 'Formulario de alta',
  feedback: 'Encuesta post-visita',
};

const PURPOSE_HELP: Record<SurveyPurpose, string> = {
  intake: 'Lo que pides al comensal cuando se anota a la fila.',
  feedback: 'Lo que preguntas cuando ya se fue.',
};

export default function SurveysPage() {
  return (
    <AdminShell>
      <Surveys />
    </AdminShell>
  );
}

function message(cause: unknown, fallback: string): string {
  return isApiRequestError(cause) ? cause.message : fallback;
}

function Surveys() {
  const api = useApi();
  const { restaurant } = useSession();
  const code = restaurant?.code;

  const [purpose, setPurpose] = useState<SurveyPurpose>('feedback');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const survey = surveys.find((item) => item.purpose === purpose) ?? null;

  useEffect(() => {
    if (!code) return;
    api.surveys
      .list(code)
      .then((data) => {
        setSurveys(data.surveys);
        setLoaded(true);
      })
      .catch((cause: unknown) => {
        setStatus(message(cause, 'No se pudieron cargar las encuestas.'));
        setLoaded(true);
      });
  }, [api, code]);

  function replace(updated: Survey) {
    setSurveys((current) => [
      ...current.filter((item) => item.id !== updated.id && item.purpose !== updated.purpose),
      updated,
    ]);
  }

  async function create() {
    if (!code) return;
    try {
      const result = await api.surveys.create(code, {
        purpose,
        title: purpose === 'feedback' ? '¿Cómo estuvo tu visita?' : 'Antes de anotarte',
        description: null,
      });
      replace(result.survey);
      setStatus('Encuesta creada. Agrega preguntas y publícala.');
    } catch (cause) {
      setStatus(message(cause, 'No se pudo crear la encuesta.'));
    }
  }

  if (!loaded) return <p className="font-body text-muted">Cargando…</p>;

  return (
    <>
      <TopBar
        title="Encuestas"
        subtitle={PURPOSE_HELP[purpose]}
        actions={
          survey && (
            <LifecycleButton code={code!} survey={survey} onChange={replace} onStatus={setStatus} />
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(PURPOSE_LABELS) as SurveyPurpose[]).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === purpose}
            onClick={() => setPurpose(option)}
            className={
              option === purpose
                ? 'rounded-full border border-primary bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground'
                : 'rounded-full border border-border bg-surface px-4 py-2 font-body text-sm font-semibold text-foreground hover:bg-black/5'
            }
          >
            {PURPOSE_LABELS[option]}
          </button>
        ))}
      </div>

      {status && <p className="mb-4 font-body text-sm text-secondary-dark">{status}</p>}

      {survey ? (
        <Builder
          key={survey.id}
          code={code!}
          survey={survey}
          onChange={replace}
          onStatus={setStatus}
        />
      ) : (
        <EmptyState
          title={`Todavía no tienes ${PURPOSE_LABELS[purpose].toLowerCase()}`}
          description={PURPOSE_HELP[purpose]}
          action={<Button onClick={() => void create()}>Crear encuesta</Button>}
        />
      )}
    </>
  );
}

interface BuilderProps {
  code: string;
  survey: Survey;
  onChange: (survey: Survey) => void;
  onStatus: (message: string) => void;
}

function LifecycleButton({ code, survey, onChange, onStatus }: BuilderProps) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const isActive = survey.status === 'active';

  async function toggle() {
    setBusy(true);
    try {
      const result = isActive
        ? await api.surveys.close(code, survey.purpose)
        : await api.surveys.publish(code, survey.purpose);
      onChange(result.survey);
      onStatus(isActive ? 'Encuesta cerrada. Las respuestas se conservan.' : 'Encuesta publicada.');
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
      {isActive ? 'Cerrar' : 'Publicar'}
    </Button>
  );
}

function Builder({ code, survey, onChange, onStatus }: BuilderProps) {
  const api = useApi();
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => toDrafts(survey.questions));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<SurveyStats | null>(null);

  const problem = definitionProblem(questions);
  const selected = questions.find((question) => question.key === selectedKey) ?? null;

  useEffect(() => {
    if (survey.status === 'draft') return;
    api.surveys
      .stats(code, survey.purpose)
      .then((data) => setStats(data.stats))
      .catch(() => setStats(null));
  }, [api, code, survey.purpose, survey.status]);

  function add(type: QuestionType) {
    const question = newQuestion(type, questions.length);
    setQuestions((current) => [...current, question]);
    setSelectedKey(question.key);
  }

  function edit(key: string, patch: Partial<QuestionDraft>) {
    setQuestions((current) =>
      current.map((question) => (question.key === key ? { ...question, ...patch } : question)),
    );
  }

  async function save() {
    setBusy(true);
    try {
      // Built field by field rather than spread: `key` is a client-side handle
      // for React and reordering, and the server has no use for it.
      const result = await api.surveys.replaceQuestions(
        code,
        survey.purpose,
        questions.map((question) => ({
          id: question.id,
          type: question.type,
          label: question.label,
          helpText: question.helpText,
          required: question.required,
          position: question.position,
          config: question.config,
        })),
      );
      onChange(result.survey);
      setQuestions(toDrafts(result.survey.questions));
      onStatus(
        result.survey.version > survey.version
          ? `Guardado. La encuesta pasó a la versión ${result.survey.version}, porque el cambio afecta cómo se leen las respuestas anteriores.`
          : 'Guardado.',
      );
    } catch (cause) {
      onStatus(message(cause, 'No se pudieron guardar las preguntas.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[14rem_1fr_18rem]">
      <Card className="flex flex-col gap-2 self-start">
        <h2 className="font-display text-base font-semibold text-foreground">Agregar</h2>
        <p className="font-body text-xs text-muted">Toca un tipo para añadirlo al final.</p>
        {QUESTION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => add(type)}
            className="rounded-lg border border-border px-3 py-2 text-left font-body text-sm text-foreground hover:bg-black/5"
          >
            {QUESTION_LABELS[type]}
          </button>
        ))}
      </Card>

      <div className="flex flex-col gap-3">
        {questions.length === 0 ? (
          <EmptyState
            title="Sin preguntas todavía"
            description="Elige un tipo de la izquierda para empezar."
          />
        ) : (
          <SortableList
            items={questions}
            getId={(question) => question.key}
            onReorder={(next) => setQuestions(repositioned(next))}
            label="Pregunta"
          >
            {(question, index) => (
              <button
                type="button"
                onClick={() => setSelectedKey(question.key)}
                className="w-full text-left"
              >
                <span className="font-body text-xs text-muted">
                  {index + 1}. {QUESTION_LABELS[question.type]}
                  {question.required && ' · obligatoria'}
                </span>
                <p className="font-body text-sm font-semibold text-foreground">
                  {question.label || <em className="text-muted">Sin texto</em>}
                </p>
                {questionProblem(question) && (
                  <p className="font-body text-xs text-error">{questionProblem(question)}</p>
                )}
              </button>
            )}
          </SortableList>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void save()} disabled={busy || problem !== null}>
            {busy ? 'Guardando…' : 'Guardar preguntas'}
          </Button>
          {problem && <span className="font-body text-sm text-error">{problem}</span>}
          <span className="font-body text-xs text-muted">Versión {survey.version}</span>
        </div>

        {stats && <ResultsPanel stats={stats} />}
      </div>

      <Card className="flex flex-col gap-4 self-start">
        <h2 className="font-display text-base font-semibold text-foreground">Propiedades</h2>
        {selected ? (
          <Properties
            question={selected}
            onEdit={(patch) => edit(selected.key, patch)}
            onRemove={() => {
              setQuestions((current) =>
                repositioned(current.filter((question) => question.key !== selected.key)),
              );
              setSelectedKey(null);
            }}
          />
        ) : (
          <p className="font-body text-sm text-muted">Selecciona una pregunta para editarla.</p>
        )}
      </Card>
    </div>
  );
}

function Properties({
  question,
  onEdit,
  onRemove,
}: {
  question: QuestionDraft;
  onEdit: (patch: Partial<QuestionDraft>) => void;
  onRemove: () => void;
}) {
  const options = question.config.options ?? [];

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="font-body text-xs text-muted">Texto de la pregunta</span>
        <Input value={question.label} onChange={(event) => onEdit({ label: event.target.value })} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-body text-xs text-muted">Texto de ayuda</span>
        <Input
          value={question.helpText ?? ''}
          onChange={(event) => onEdit({ helpText: event.target.value || null })}
        />
      </label>

      <Toggle
        checked={question.required}
        onChange={(required) => onEdit({ required })}
        label="Obligatoria"
        description="El comensal debe responderla."
      />

      {CHOICE_TYPES.includes(question.type) && (
        <div className="flex flex-col gap-2">
          <span className="font-body text-xs text-muted">Opciones</span>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option}
                onChange={(event) =>
                  onEdit({
                    config: {
                      ...question.config,
                      options: options.map((item, at) =>
                        at === index ? event.target.value : item,
                      ),
                    },
                  })
                }
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onEdit({
                    config: {
                      ...question.config,
                      options: options.filter((_, at) => at !== index),
                    },
                  })
                }
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              onEdit({
                config: {
                  ...question.config,
                  options: [...options, `Opción ${options.length + 1}`],
                },
              })
            }
          >
            + Opción
          </Button>
        </div>
      )}

      {question.type === 'rating' && (
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-muted">Escala máxima</span>
          <Input
            type="number"
            min={2}
            max={10}
            value={question.config.maxRating ?? 5}
            onChange={(event) =>
              onEdit({ config: { ...question.config, maxRating: Number(event.target.value) } })
            }
          />
        </label>
      )}

      <Button variant="ghost" className="self-start text-error" onClick={onRemove}>
        Eliminar pregunta
      </Button>
    </>
  );
}

function ResultsPanel({ stats }: { stats: SurveyStats }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-foreground">Resultados</h2>
        <span className="font-body text-xs text-muted">{stats.responses} respuestas</span>
      </div>

      {stats.responses === 0 ? (
        <p className="font-body text-sm text-muted">
          Sin respuestas todavía. Aparecerán aquí en cuanto alguien conteste.
        </p>
      ) : (
        stats.questions.map((question) => (
          <div key={question.questionId} className="flex flex-col gap-1">
            <p className="font-body text-sm font-semibold text-foreground">{question.label}</p>
            <p className="font-body text-xs text-muted">
              {question.answered} respuestas
              {question.average !== null && ` · promedio ${question.average}`}
            </p>

            {question.distribution.length > 0 && (
              <ul className="flex flex-col gap-1 pt-1">
                {question.distribution.map((item) => (
                  <li key={item.value} className="flex justify-between font-body text-xs">
                    <span className="text-foreground">{item.value}</span>
                    <span className="text-muted">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}

            {question.samples.map((sample, index) => (
              <p key={index} className="font-body text-xs italic text-muted">
                “{sample}”
              </p>
            ))}
          </div>
        ))
      )}
    </Card>
  );
}
