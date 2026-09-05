import {
  JOB_APPLICATION_ASSISTANT_OPERATIONS,
  type JobApplication,
  type JobApplicationAssistantOperation,
  type JobApplicationAssistantResponse,
  type JobApplicationEvidenceReference,
} from '@antin-os/shared';
import { Copy, RotateCcw, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { jobApplicationErrorMessage } from './job-application-errors';
import {
  useGenerateJobApplicationAssistantMutation,
  useUpdateJobApplicationMutation,
} from './mutations/job-application.mutations';

const INPUT_CLASS =
  'min-h-11 w-full border border-slate-400 bg-white px-3 py-2 text-slate-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-slate-100';
const BUTTON_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 border border-slate-400 bg-white px-3 py-2 font-medium text-slate-800 hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60';
const PRIMARY_BUTTON_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 border border-teal-800 bg-teal-800 px-3 py-2 font-medium text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60';

const OPERATION_LABELS: Record<JobApplicationAssistantOperation, string> = {
  analyze: 'Analyze job',
  interviewQuestions: 'Interview questions',
  selfIntroduction: 'Self-introduction',
  coverLetter: 'Cover letter',
  followUpMessage: 'Follow-up message',
  nextAction: 'Next action',
};

type DestinationField = 'company' | 'position' | 'notes' | 'followUpNotes';

type ApplyPreview = {
  field: DestinationField;
  label: string;
  value: string;
  replacing: boolean;
  stale: boolean;
};

type AssistantFormValues = Record<DestinationField, string>;

function evidenceLabel(reference: JobApplicationEvidenceReference) {
  return `${reference.label} — ${reference.field}`;
}

function EvidenceList({
  evidence,
}: {
  evidence: JobApplicationEvidenceReference[];
}) {
  return evidence.length > 0 ? (
    <ul className="m-0 grid gap-1 pl-5 text-sm text-slate-600">
      {evidence.map((reference) => (
        <li
          key={`${reference.sourceType}:${reference.sourceId}:${reference.field}`}
        >
          {evidenceLabel(reference)}
        </li>
      ))}
    </ul>
  ) : (
    <p className="m-0 text-sm text-amber-800">
      No supporting portfolio evidence; confirmation is required.
    </p>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="grid gap-2">
      <h4 className="m-0 font-semibold text-slate-950">{title}</h4>
      {items.length > 0 ? (
        <ul className="m-0 grid gap-1 pl-5">
          {items.map((item, index) => (
            <li key={`${index}:${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-sm text-slate-500">None identified.</p>
      )}
    </section>
  );
}

function resultAsNotes(result: JobApplicationAssistantResponse): string {
  if (result.operation === 'interviewQuestions') {
    return result.questions
      .map(
        (item, index) =>
          `Interview question ${index + 1}: ${item.question}\nSuggested answer: ${item.suggestedAnswer}`,
      )
      .join('\n\n');
  }

  if (
    result.operation === 'selfIntroduction' ||
    result.operation === 'coverLetter'
  ) {
    return result.content;
  }

  if (result.operation === 'nextAction') {
    return [
      `Next action: ${result.action}`,
      `Rationale: ${result.rationale}`,
      result.suggestedDate ? `Suggested date: ${result.suggestedDate}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

export function JobApplicationAssistantPanel({
  application,
  formValues,
  onApplied,
}: {
  application: JobApplication;
  formValues: AssistantFormValues;
  onApplied: (field: DestinationField, value: string) => void;
}) {
  const generation = useGenerateJobApplicationAssistantMutation();
  const update = useUpdateJobApplicationMutation();
  const [result, setResult] = useState<JobApplicationAssistantResponse | null>(
    null,
  );
  const [lastOperation, setLastOperation] =
    useState<JobApplicationAssistantOperation>('analyze');
  const [generationError, setGenerationError] = useState('');
  const [applyError, setApplyError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [preview, setPreview] = useState<ApplyPreview | null>(null);
  const hasSavedDescription = Boolean(application.jobDescription?.trim());
  const stale = Boolean(
    result && result.sourceUpdatedAt !== application.updatedAt,
  );
  const busy = generation.isPending || update.isPending;

  async function generate(operation: JobApplicationAssistantOperation) {
    if (generation.isPending || !hasSavedDescription) {
      return;
    }

    setLastOperation(operation);
    setGenerationError('');
    setApplyError('');
    setFeedback('');
    setPreview(null);

    try {
      const nextResult = await generation.mutateAsync({
        id: application.id,
        input: { operation },
      });
      setResult(nextResult);
    } catch (error) {
      setResult(null);
      setGenerationError(
        jobApplicationErrorMessage(
          error,
          'The AI assistant could not generate this result. Retry when ready.',
        ),
      );
    }
  }

  function prepareApply(field: DestinationField, label: string, value: string) {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    setApplyError('');
    setFeedback('');
    setPreview({
      field,
      label,
      value: normalized,
      replacing: Boolean(formValues[field].trim()),
      stale,
    });
  }

  function prepareNotes(mode: 'append' | 'replace') {
    if (!result) {
      return;
    }

    const generated = resultAsNotes(result).trim();
    const current = formValues.notes.trim();
    const value =
      mode === 'append' && current ? `${current}\n\n${generated}` : generated;
    prepareApply(
      'notes',
      mode === 'append' ? 'Notes (append)' : 'Notes (replace)',
      value,
    );
  }

  async function confirmApply() {
    if (!preview || update.isPending) {
      return;
    }

    setApplyError('');

    try {
      await update.mutateAsync({
        id: application.id,
        input: { [preview.field]: preview.value },
      });
      onApplied(preview.field, preview.value);
      setFeedback(`${preview.label} was updated after explicit review.`);
      setPreview(null);
    } catch (error) {
      setApplyError(
        jobApplicationErrorMessage(
          error,
          `${preview.label} was not updated. Your generated review is still here.`,
        ),
      );
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback('Copied the reviewed content to the clipboard.');
    } catch {
      setFeedback(
        'Clipboard access was unavailable. Select and copy the text.',
      );
    }
  }

  function updateResult(next: JobApplicationAssistantResponse) {
    setResult(next);
    setPreview(null);
    setFeedback('');
  }

  return (
    <section
      className="grid gap-5 border border-teal-300 bg-teal-50 p-5 shadow-sm"
      aria-labelledby="job-assistant-title"
    >
      <header>
        <p className="m-0 text-sm font-semibold uppercase tracking-wide text-teal-800">
          Private and transient
        </p>
        <h3
          id="job-assistant-title"
          className="m-0 text-xl font-semibold text-slate-950"
        >
          AI job application assistant
        </h3>
        <p className="mb-0 text-slate-700">
          Generate one structured result from the saved job description and your
          managed portfolio evidence. Nothing is saved or sent until you
          explicitly apply a reviewed field.
        </p>
      </header>

      {!hasSavedDescription ? (
        <p className="m-0 border border-amber-400 bg-amber-50 p-3 text-amber-900">
          Save a non-empty job description before using the assistant.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2" aria-label="Assistant outputs">
        {JOB_APPLICATION_ASSISTANT_OPERATIONS.map((operation) => (
          <button
            className={
              operation === lastOperation && result
                ? PRIMARY_BUTTON_CLASS
                : BUTTON_CLASS
            }
            type="button"
            key={operation}
            disabled={busy || !hasSavedDescription}
            aria-label={`Generate ${OPERATION_LABELS[operation]}`}
            onClick={() => void generate(operation)}
          >
            <Sparkles size={16} aria-hidden="true" />
            {OPERATION_LABELS[operation]}
          </button>
        ))}
      </div>

      {generation.isPending ? (
        <p className="m-0" role="status" aria-live="polite">
          Generating {OPERATION_LABELS[lastOperation]} for review…
        </p>
      ) : null}

      {generationError ? (
        <div
          className="grid gap-3 border border-red-300 bg-red-50 p-3"
          role="alert"
        >
          <p className="m-0 text-red-800">{generationError}</p>
          <button
            className={BUTTON_CLASS}
            type="button"
            disabled={generation.isPending}
            onClick={() => void generate(lastOperation)}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Retry {OPERATION_LABELS[lastOperation]}
          </button>
        </div>
      ) : null}

      {result ? (
        <section
          className="grid gap-5 border border-slate-300 bg-white p-4"
          aria-label="Assistant review"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="m-0 text-lg font-semibold text-slate-950">
                Review {OPERATION_LABELS[result.operation]}
              </h4>
              <p className="m-0 text-sm text-slate-600">
                Edit, copy, or choose an explicit destination. Generated text is
                not saved automatically.
              </p>
            </div>
            <button
              className={BUTTON_CLASS}
              type="button"
              disabled={busy}
              onClick={() => {
                setResult(null);
                setPreview(null);
                setFeedback('Draft discarded without saving.');
              }}
            >
              <X size={16} aria-hidden="true" />
              Cancel review
            </button>
          </div>

          {stale ? (
            <p
              className="m-0 border border-amber-400 bg-amber-50 p-3 text-amber-900"
              role="alert"
            >
              This result is stale because the application changed after
              generation. Regenerate it, or consciously continue through the
              apply preview.
            </p>
          ) : null}

          {result.operation === 'analyze' ? (
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 font-medium">
                  Suggested company
                  <input
                    className={INPUT_CLASS}
                    value={result.suggestedCompany ?? ''}
                    onChange={(event) =>
                      updateResult({
                        ...result,
                        suggestedCompany: event.target.value || null,
                      })
                    }
                  />
                  <button
                    className={BUTTON_CLASS}
                    type="button"
                    disabled={!result.suggestedCompany || busy}
                    onClick={() =>
                      prepareApply(
                        'company',
                        'Company',
                        result.suggestedCompany ?? '',
                      )
                    }
                  >
                    Apply company
                  </button>
                </label>
                <label className="grid gap-1 font-medium">
                  Suggested position
                  <input
                    className={INPUT_CLASS}
                    value={result.suggestedPosition ?? ''}
                    onChange={(event) =>
                      updateResult({
                        ...result,
                        suggestedPosition: event.target.value || null,
                      })
                    }
                  />
                  <button
                    className={BUTTON_CLASS}
                    type="button"
                    disabled={!result.suggestedPosition || busy}
                    onClick={() =>
                      prepareApply(
                        'position',
                        'Position',
                        result.suggestedPosition ?? '',
                      )
                    }
                  >
                    Apply position
                  </button>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <BulletSection
                  title="Responsibilities"
                  items={result.responsibilities}
                />
                <BulletSection
                  title="Required skills"
                  items={result.requiredSkills}
                />
                <BulletSection
                  title="Preferred skills"
                  items={result.preferredSkills}
                />
                <BulletSection title="Keywords" items={result.keywords} />
              </div>
              <section className="grid gap-3">
                <h4 className="m-0 font-semibold text-slate-950">
                  Matching qualifications
                </h4>
                {result.matchingQualifications.length > 0 ? (
                  result.matchingQualifications.map((match, index) => (
                    <article
                      className="grid gap-2 border border-emerald-300 bg-emerald-50 p-3"
                      key={`${index}:${match.requirement}`}
                    >
                      <strong>{match.requirement}</strong>
                      <p className="m-0">{match.qualification}</p>
                      <EvidenceList evidence={match.evidence} />
                    </article>
                  ))
                ) : (
                  <p className="m-0">No evidence-backed matches identified.</p>
                )}
              </section>
              <section className="grid gap-3">
                <h4 className="m-0 font-semibold text-slate-950">
                  Honest gaps
                </h4>
                {result.gaps.map((gap, index) => (
                  <article
                    className="border border-amber-300 bg-amber-50 p-3"
                    key={`${index}:${gap.requirement}`}
                  >
                    <strong>{gap.requirement}</strong>
                    <p className="mb-0">{gap.reason}</p>
                  </article>
                ))}
              </section>
              <BulletSection title="Unknowns" items={result.unknowns} />
            </div>
          ) : null}

          {result.operation === 'interviewQuestions' ? (
            <div className="grid gap-4">
              {result.questions.map((item, index) => (
                <fieldset
                  className="grid gap-3 border border-slate-300 p-3"
                  key={index}
                >
                  <legend className="px-1 font-semibold">
                    Question {index + 1}
                  </legend>
                  <label className="grid gap-1 font-medium">
                    Interview question
                    <textarea
                      className={`${INPUT_CLASS} min-h-20 resize-y`}
                      value={item.question}
                      onChange={(event) =>
                        updateResult({
                          ...result,
                          questions: result.questions.map(
                            (question, itemIndex) =>
                              itemIndex === index
                                ? { ...question, question: event.target.value }
                                : question,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-1 font-medium">
                    Suggested answer
                    <textarea
                      className={`${INPUT_CLASS} min-h-32 resize-y`}
                      value={item.suggestedAnswer}
                      onChange={(event) =>
                        updateResult({
                          ...result,
                          questions: result.questions.map(
                            (question, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...question,
                                    suggestedAnswer: event.target.value,
                                  }
                                : question,
                          ),
                        })
                      }
                    />
                  </label>
                  <EvidenceList evidence={item.evidence} />
                  {item.needsConfirmation ? (
                    <p className="m-0 text-amber-800">
                      This answer needs owner confirmation.
                    </p>
                  ) : null}
                </fieldset>
              ))}
            </div>
          ) : null}

          {result.operation === 'selfIntroduction' ||
          result.operation === 'coverLetter' ||
          result.operation === 'followUpMessage' ? (
            <label className="grid gap-1 font-medium">
              Editable {OPERATION_LABELS[result.operation].toLowerCase()}
              <textarea
                className={`${INPUT_CLASS} min-h-56 resize-y`}
                value={result.content}
                onChange={(event) =>
                  updateResult({ ...result, content: event.target.value })
                }
              />
            </label>
          ) : null}

          {result.operation === 'nextAction' ? (
            <div className="grid gap-4">
              <label className="grid gap-1 font-medium">
                Suggested action
                <textarea
                  className={`${INPUT_CLASS} min-h-24 resize-y`}
                  value={result.action}
                  onChange={(event) =>
                    updateResult({ ...result, action: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 font-medium">
                Rationale
                <textarea
                  className={`${INPUT_CLASS} min-h-24 resize-y`}
                  value={result.rationale}
                  onChange={(event) =>
                    updateResult({ ...result, rationale: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 font-medium">
                Suggested date (not applied automatically)
                <input
                  className={INPUT_CLASS}
                  type="date"
                  value={result.suggestedDate ?? ''}
                  onChange={(event) =>
                    updateResult({
                      ...result,
                      suggestedDate: event.target.value || null,
                    })
                  }
                />
              </label>
            </div>
          ) : null}

          {result.needsConfirmation.length > 0 ? (
            <BulletSection
              title="Needs your confirmation"
              items={result.needsConfirmation}
            />
          ) : null}

          {result.operation !== 'analyze' ? (
            <div className="flex flex-wrap gap-2">
              <button
                className={BUTTON_CLASS}
                type="button"
                disabled={busy}
                onClick={() =>
                  void copyText(
                    result.operation === 'followUpMessage'
                      ? result.content
                      : resultAsNotes(result),
                  )
                }
              >
                <Copy size={16} aria-hidden="true" />
                Copy reviewed content
              </button>
              {result.operation === 'followUpMessage' ? (
                <button
                  className={PRIMARY_BUTTON_CLASS}
                  type="button"
                  disabled={busy || !result.content.trim()}
                  onClick={() =>
                    prepareApply(
                      'followUpNotes',
                      'Follow-up notes',
                      result.content,
                    )
                  }
                >
                  Apply to follow-up notes
                </button>
              ) : (
                <>
                  <button
                    className={BUTTON_CLASS}
                    type="button"
                    disabled={busy || !resultAsNotes(result).trim()}
                    onClick={() => prepareNotes('append')}
                  >
                    Append to notes
                  </button>
                  <button
                    className={BUTTON_CLASS}
                    type="button"
                    disabled={busy || !resultAsNotes(result).trim()}
                    onClick={() => prepareNotes('replace')}
                  >
                    Replace notes
                  </button>
                </>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {preview ? (
        <section
          className="grid gap-3 border-2 border-teal-700 bg-white p-4"
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-apply-preview-title"
        >
          <h4
            id="assistant-apply-preview-title"
            className="m-0 text-lg font-semibold"
          >
            Confirm apply to {preview.label}
          </h4>
          {preview.replacing ? (
            <p className="m-0 text-amber-800">
              This will replace or incorporate non-empty stored or unsaved form
              text.
            </p>
          ) : null}
          {preview.stale ? (
            <p className="m-0 text-amber-800">
              The generated source is stale. Confirming means you consciously
              continue with this reviewed value.
            </p>
          ) : null}
          <label className="grid gap-1 font-medium">
            Exact resulting value
            <textarea
              className={`${INPUT_CLASS} min-h-36 resize-y`}
              readOnly
              value={preview.value}
            />
          </label>
          {applyError ? (
            <p className="m-0 text-red-800" role="alert">
              {applyError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className={BUTTON_CLASS}
              type="button"
              disabled={update.isPending}
              onClick={() => setPreview(null)}
            >
              Cancel apply
            </button>
            <button
              className={PRIMARY_BUTTON_CLASS}
              type="button"
              disabled={update.isPending}
              onClick={() => void confirmApply()}
            >
              {update.isPending
                ? 'Applying'
                : `Confirm apply to ${preview.label}`}
            </button>
          </div>
        </section>
      ) : null}

      {feedback ? (
        <p
          className="m-0 border border-teal-300 bg-white p-3 text-teal-900"
          role="status"
        >
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
