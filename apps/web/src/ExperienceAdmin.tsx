import { FormEvent, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type { CreateExperienceInput, Experience } from '@antin-os/shared';
import {
  useCreateExperienceMutation,
  useDeleteExperienceMutation,
  useReorderExperiencesMutation,
  useUpdateExperienceMutation,
} from './mutations/experience.mutations';
import { useExperiences } from './queries/experience.queries';

type ExperienceFormValues = {
  company: string;
  role: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  summary: string;
  displayOrder: string;
  isPublic: boolean;
};

type FormErrors = Partial<Record<keyof ExperienceFormValues | 'form', string>>;

const PANEL_CLASS = 'border border-slate-300 bg-white p-5';
const BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-slate-400 bg-white px-3 py-2 text-slate-800 hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60';
const PRIMARY_BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-teal-700 bg-teal-700 px-3 py-2 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60';
const DANGER_BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-red-700 bg-white px-3 py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60';
const FIELD_CLASS = 'grid gap-1.5';
const INPUT_CLASS =
  'min-h-10 w-full border border-slate-400 px-2.5 py-2 font-[inherit]';

const EMPTY_EXPERIENCE: ExperienceFormValues = {
  company: '',
  role: '',
  location: '',
  employmentType: 'Full-time',
  startDate: '',
  endDate: '',
  isCurrent: false,
  summary: '',
  displayOrder: '0',
  isPublic: false,
};

const EMPLOYMENT_TYPE_OPTIONS = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
  'Apprenticeship',
] as const;

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();

  if (!message) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(message) as { message?: string | string[] };

    if (Array.isArray(parsed.message)) {
      return parsed.message.join(' ');
    }

    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    // Use the raw message below.
  }

  return message;
}

function dateInput(value: string) {
  return value ? value.slice(0, 10) : '';
}

function experienceToForm(experience: Experience): ExperienceFormValues {
  return {
    company: experience.company,
    role: experience.role,
    location: experience.location,
    employmentType: experience.employmentType,
    startDate: dateInput(experience.startDate),
    endDate: dateInput(experience.endDate ?? ''),
    isCurrent: experience.isCurrent,
    summary: experience.summary,
    displayOrder: String(experience.displayOrder),
    isPublic: experience.isPublic,
  };
}

function toExperienceInput(
  values: ExperienceFormValues,
): CreateExperienceInput {
  return {
    company: values.company.trim(),
    role: values.role.trim(),
    location: values.location.trim(),
    employmentType: values.employmentType.trim(),
    startDate: values.startDate,
    endDate: values.isCurrent ? null : values.endDate || null,
    isCurrent: values.isCurrent,
    summary: values.summary.trim(),
    achievements: [],
    technologies: [],
    displayOrder: Number(values.displayOrder),
    isPublic: values.isPublic,
  };
}

export function validateExperienceForm(
  values: ExperienceFormValues,
): FormErrors {
  const errors: FormErrors = {};
  const displayOrder = Number(values.displayOrder);

  for (const key of [
    'company',
    'role',
    'location',
    'employmentType',
    'summary',
  ] as const) {
    if (!values[key].trim()) {
      errors[key] = 'This field is required.';
    }
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  }

  if (values.isCurrent && values.endDate) {
    errors.endDate = 'Current roles cannot have an end date.';
  }

  if (
    values.startDate &&
    values.endDate &&
    new Date(values.endDate).getTime() < new Date(values.startDate).getTime()
  ) {
    errors.endDate = 'End date cannot be before start date.';
  }

  if (
    !Number.isInteger(displayOrder) ||
    displayOrder < 0 ||
    values.displayOrder.trim() === ''
  ) {
    errors.displayOrder = 'Display order must be a non-negative integer.';
  }

  return errors;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatDateRange(experience: Experience) {
  const end = experience.isCurrent
    ? 'Present'
    : experience.endDate
      ? formatDate(experience.endDate)
      : 'Present';

  return `${formatDate(experience.startDate)} - ${end}`;
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="m-0 text-sm text-red-700" id={id}>
      {message}
    </p>
  );
}

export function ExperienceAdmin() {
  const experiencesQuery = useExperiences();
  const createExperienceMutation = useCreateExperienceMutation();
  const updateExperienceMutation = useUpdateExperienceMutation();
  const deleteExperienceMutation = useDeleteExperienceMutation();
  const reorderExperiencesMutation = useReorderExperiencesMutation();
  const experiences = experiencesQuery.data ?? [];
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<ExperienceFormValues>(EMPTY_EXPERIENCE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [experienceToDelete, setExperienceToDelete] =
    useState<Experience | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [listError, setListError] = useState('');

  const sortedExperiences = useMemo(
    () =>
      [...experiences].sort(
        (first, second) =>
          first.displayOrder - second.displayOrder ||
          new Date(second.startDate).getTime() -
            new Date(first.startDate).getTime(),
      ),
    [experiences],
  );

  const isSaving =
    createExperienceMutation.isPending || updateExperienceMutation.isPending;
  const isReordering = reorderExperiencesMutation.isPending;
  const isEditing = editingExperienceId !== null;

  function startNewExperience() {
    const nextDisplayOrder =
      sortedExperiences.length > 0
        ? Math.max(
            ...sortedExperiences.map((experience) => experience.displayOrder),
          ) + 1
        : 0;

    setEditingExperienceId(null);
    setForm({
      ...EMPTY_EXPERIENCE,
      displayOrder: String(nextDisplayOrder),
    });
    setErrors({});
  }

  function startEditExperience(experience: Experience) {
    setEditingExperienceId(experience.id);
    setForm(experienceToForm(experience));
    setErrors({});
  }

  function updateField<K extends keyof ExperienceFormValues>(
    key: K,
    value: ExperienceFormValues[K],
  ) {
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    setForm((current) => {
      if (key === 'isCurrent' && value === true) {
        return { ...current, isCurrent: true, endDate: '' };
      }

      return { ...current, [key]: value };
    });
  }

  async function submitExperience(event: FormEvent) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const nextErrors = validateExperienceForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      if (isEditing) {
        await updateExperienceMutation.mutateAsync({
          id: editingExperienceId,
          input: toExperienceInput(form),
        });
      } else {
        await createExperienceMutation.mutateAsync(toExperienceInput(form));
      }

      startNewExperience();
    } catch (error) {
      setErrors({
        form: errorMessage(error, 'Experience save failed.'),
      });
    }
  }

  async function togglePublication(experience: Experience) {
    if (updateExperienceMutation.isPending) {
      return;
    }

    setListError('');

    try {
      await updateExperienceMutation.mutateAsync({
        id: experience.id,
        input: { isPublic: !experience.isPublic },
      });
    } catch (error) {
      setListError(errorMessage(error, 'Publication update failed.'));
    }
  }

  async function confirmDelete() {
    if (!experienceToDelete || deleteExperienceMutation.isPending) {
      return;
    }

    setDeleteError('');

    try {
      await deleteExperienceMutation.mutateAsync(experienceToDelete.id);
      setExperienceToDelete(null);
    } catch (error) {
      setDeleteError(errorMessage(error, 'Experience deletion failed.'));
    }
  }

  async function moveExperience(experience: Experience, direction: -1 | 1) {
    if (isReordering) {
      return;
    }

    const currentIndex = sortedExperiences.findIndex(
      (candidate) => candidate.id === experience.id,
    );
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= experiences.length) {
      return;
    }

    const reordered = [...sortedExperiences];
    const [movedExperience] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, movedExperience);
    setListError('');

    try {
      await reorderExperiencesMutation.mutateAsync({
        items: reordered.map((item, index) => ({
          id: item.id,
          displayOrder: index,
        })),
      });
    } catch (error) {
      setListError(errorMessage(error, 'Experience reorder failed.'));
    }
  }

  function deleteDialogTitle(experience: Experience) {
    return `Delete ${experience.role} at ${experience.company}?`;
  }

  return (
    <section className="grid gap-5" aria-label="Experience management">
      <section className={PANEL_CLASS} aria-labelledby="experience-form-title">
        <form className="grid gap-4" onSubmit={submitExperience}>
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2
                id="experience-form-title"
                className="m-0 text-[24px] font-semibold text-slate-950"
              >
                {isEditing ? 'Edit experience' : 'New experience'}
              </h2>
              <p className="m-0 text-slate-600">
                New entries stay private until you publish them.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={BUTTON_CLASS}
                type="button"
                disabled={isSaving}
                onClick={startNewExperience}
              >
                <Plus size={18} aria-hidden="true" />
                New
              </button>
              <button
                className={PRIMARY_BUTTON_CLASS}
                type="submit"
                disabled={isSaving}
              >
                <Save size={18} aria-hidden="true" />
                {isSaving ? 'Saving' : 'Save'}
              </button>
            </div>
          </header>

          {errors.form ? (
            <p
              className="m-0 border border-red-300 bg-red-50 p-3 text-red-700"
              role="alert"
            >
              {errors.form}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className={FIELD_CLASS}>
              <label htmlFor="experience-company">Company</label>
              <input
                id="experience-company"
                className={INPUT_CLASS}
                aria-invalid={Boolean(errors.company)}
                aria-describedby={
                  errors.company ? 'experience-company-error' : undefined
                }
                value={form.company}
                onChange={(event) => updateField('company', event.target.value)}
              />
              <ErrorText
                id="experience-company-error"
                message={errors.company}
              />
            </div>

            <div className={FIELD_CLASS}>
              <label htmlFor="experience-role">Role</label>
              <input
                id="experience-role"
                className={INPUT_CLASS}
                aria-invalid={Boolean(errors.role)}
                aria-describedby={
                  errors.role ? 'experience-role-error' : undefined
                }
                value={form.role}
                onChange={(event) => updateField('role', event.target.value)}
              />
              <ErrorText id="experience-role-error" message={errors.role} />
            </div>

            <div className={FIELD_CLASS}>
              <label htmlFor="experience-location">Location</label>
              <input
                id="experience-location"
                className={INPUT_CLASS}
                aria-invalid={Boolean(errors.location)}
                aria-describedby={
                  errors.location ? 'experience-location-error' : undefined
                }
                value={form.location}
                onChange={(event) =>
                  updateField('location', event.target.value)
                }
              />
              <ErrorText
                id="experience-location-error"
                message={errors.location}
              />
            </div>

            <div className={FIELD_CLASS}>
              <label htmlFor="experience-employment-type">
                Employment type
              </label>
              <select
                id="experience-employment-type"
                className={INPUT_CLASS}
                aria-invalid={Boolean(errors.employmentType)}
                aria-describedby={
                  errors.employmentType
                    ? 'experience-employment-type-error'
                    : undefined
                }
                value={form.employmentType}
                onChange={(event) =>
                  updateField('employmentType', event.target.value)
                }
              >
                <option value="">Select employment type</option>
                {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ErrorText
                id="experience-employment-type-error"
                message={errors.employmentType}
              />
            </div>

            <div className={FIELD_CLASS}>
              <label htmlFor="experience-start-date">Start date</label>
              <input
                id="experience-start-date"
                className={INPUT_CLASS}
                type="date"
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={
                  errors.startDate ? 'experience-start-date-error' : undefined
                }
                value={form.startDate}
                onChange={(event) =>
                  updateField('startDate', event.target.value)
                }
              />
              <ErrorText
                id="experience-start-date-error"
                message={errors.startDate}
              />
            </div>

            <div className={FIELD_CLASS}>
              <label htmlFor="experience-end-date">End date</label>
              <input
                id="experience-end-date"
                className={INPUT_CLASS}
                type="date"
                disabled={form.isCurrent}
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={
                  errors.endDate ? 'experience-end-date-error' : undefined
                }
                value={form.endDate}
                onChange={(event) => updateField('endDate', event.target.value)}
              />
              <ErrorText
                id="experience-end-date-error"
                message={errors.endDate}
              />
            </div>
          </div>

          <div className={FIELD_CLASS}>
            <label htmlFor="experience-summary">Summary</label>
            <textarea
              id="experience-summary"
              className={`${INPUT_CLASS} min-h-28 resize-y`}
              aria-invalid={Boolean(errors.summary)}
              aria-describedby={
                errors.summary ? 'experience-summary-error' : undefined
              }
              value={form.summary}
              onChange={(event) => updateField('summary', event.target.value)}
            />
            <ErrorText id="experience-summary-error" message={errors.summary} />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className={FIELD_CLASS}>
              <label htmlFor="experience-display-order">Display order</label>
              <input
                id="experience-display-order"
                className={`${INPUT_CLASS} max-w-32`}
                type="number"
                min={0}
                step={1}
                aria-invalid={Boolean(errors.displayOrder)}
                aria-describedby={
                  errors.displayOrder
                    ? 'experience-display-order-error'
                    : undefined
                }
                value={form.displayOrder}
                onChange={(event) =>
                  updateField('displayOrder', event.target.value)
                }
              />
              <ErrorText
                id="experience-display-order-error"
                message={errors.displayOrder}
              />
            </div>

            <label className="mt-6 flex max-w-max items-center gap-3 border border-slate-300 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={form.isCurrent}
                onChange={(event) =>
                  updateField('isCurrent', event.target.checked)
                }
              />
              <span>Current role</span>
            </label>

            <label className="mt-6 flex max-w-max items-center gap-3 border border-slate-300 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(event) =>
                  updateField('isPublic', event.target.checked)
                }
              />
              <span>{form.isPublic ? 'Public' : 'Private'}</span>
            </label>
          </div>
        </form>
      </section>

      <section className={PANEL_CLASS} aria-labelledby="experience-list-title">
        <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              id="experience-list-title"
              className="m-0 text-[24px] font-semibold text-slate-950"
            >
              Experience
            </h2>
            <p className="m-0 text-slate-600">
              Manage work history, publication state, and homepage order.
            </p>
          </div>
        </header>

        {listError ? (
          <p
            className="mb-4 border border-red-300 bg-red-50 p-3 text-red-700"
            role="alert"
          >
            {listError}
          </p>
        ) : null}

        {experiencesQuery.isLoading ? (
          <p role="status">Loading experience</p>
        ) : null}

        {experiencesQuery.isError ? (
          <div
            className="grid gap-3 border border-red-300 bg-red-50 p-4"
            role="alert"
          >
            <p className="m-0">
              {errorMessage(
                experiencesQuery.error,
                'Could not load experience.',
              )}
            </p>
            <button
              className={BUTTON_CLASS}
              type="button"
              onClick={() => void experiencesQuery.refetch()}
            >
              <RotateCcw size={18} aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : null}

        {!experiencesQuery.isLoading && !experiencesQuery.isError ? (
          sortedExperiences.length > 0 ? (
            <div className="grid gap-3">
              <table className="hidden min-w-full border-collapse text-left md:table">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="py-2 pr-3">Company</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Dates</th>
                    <th className="py-2 pr-3">State</th>
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExperiences.map((experience, index) => (
                    <tr
                      className="border-b border-slate-200"
                      key={experience.id}
                    >
                      <td className="py-3 pr-3 font-medium">
                        {experience.company}
                      </td>
                      <td className="py-3 pr-3">{experience.role}</td>
                      <td className="py-3 pr-3">{experience.employmentType}</td>
                      <td className="py-3 pr-3">
                        {formatDateRange(experience)}
                      </td>
                      <td className="py-3 pr-3">
                        {experience.isPublic ? 'Public' : 'Private'}
                        {experience.isCurrent ? ', Current' : ''}
                      </td>
                      <td className="py-3 pr-3">{experience.displayOrder}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            className={BUTTON_CLASS}
                            type="button"
                            aria-label={`Move ${experience.role} at ${experience.company} up`}
                            disabled={index === 0 || isReordering}
                            onClick={() => void moveExperience(experience, -1)}
                          >
                            <ArrowUp size={16} aria-hidden="true" />
                          </button>
                          <button
                            className={BUTTON_CLASS}
                            type="button"
                            aria-label={`Move ${experience.role} at ${experience.company} down`}
                            disabled={
                              index === sortedExperiences.length - 1 ||
                              isReordering
                            }
                            onClick={() => void moveExperience(experience, 1)}
                          >
                            <ArrowDown size={16} aria-hidden="true" />
                          </button>
                          <button
                            className={BUTTON_CLASS}
                            type="button"
                            aria-label={
                              experience.isPublic
                                ? `Unpublish ${experience.role} at ${experience.company}`
                                : `Publish ${experience.role} at ${experience.company}`
                            }
                            disabled={updateExperienceMutation.isPending}
                            onClick={() => void togglePublication(experience)}
                          >
                            {experience.isPublic ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            className={BUTTON_CLASS}
                            type="button"
                            aria-label={`Edit ${experience.role} at ${experience.company}`}
                            onClick={() => startEditExperience(experience)}
                          >
                            <Edit3 size={16} aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            className={DANGER_BUTTON_CLASS}
                            type="button"
                            aria-label={`Delete ${experience.role} at ${experience.company}`}
                            onClick={() => {
                              setDeleteError('');
                              setExperienceToDelete(experience);
                            }}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid gap-3 md:hidden">
                {sortedExperiences.map((experience, index) => (
                  <article
                    className="grid gap-2 border border-slate-300 p-3"
                    key={experience.id}
                  >
                    <div>
                      <h3 className="m-0 text-lg font-semibold">
                        {experience.role}
                      </h3>
                      <p className="m-0 text-sm text-slate-600">
                        {experience.company}
                      </p>
                    </div>
                    <p className="m-0">Type: {experience.employmentType}</p>
                    <p className="m-0">Dates: {formatDateRange(experience)}</p>
                    <p className="m-0">
                      State: {experience.isPublic ? 'Public' : 'Private'}
                      {experience.isCurrent ? ', Current' : ''}
                    </p>
                    <p className="m-0">Order: {experience.displayOrder}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={BUTTON_CLASS}
                        type="button"
                        aria-label={`Move ${experience.role} at ${experience.company} up`}
                        disabled={index === 0 || isReordering}
                        onClick={() => void moveExperience(experience, -1)}
                      >
                        <ArrowUp size={16} aria-hidden="true" />
                      </button>
                      <button
                        className={BUTTON_CLASS}
                        type="button"
                        aria-label={`Move ${experience.role} at ${experience.company} down`}
                        disabled={
                          index === sortedExperiences.length - 1 || isReordering
                        }
                        onClick={() => void moveExperience(experience, 1)}
                      >
                        <ArrowDown size={16} aria-hidden="true" />
                      </button>
                      <button
                        className={BUTTON_CLASS}
                        type="button"
                        aria-label={
                          experience.isPublic
                            ? `Unpublish ${experience.role} at ${experience.company}`
                            : `Publish ${experience.role} at ${experience.company}`
                        }
                        disabled={updateExperienceMutation.isPending}
                        onClick={() => void togglePublication(experience)}
                      >
                        {experience.isPublic ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        className={BUTTON_CLASS}
                        type="button"
                        aria-label={`Edit ${experience.role} at ${experience.company}`}
                        onClick={() => startEditExperience(experience)}
                      >
                        <Edit3 size={16} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        className={DANGER_BUTTON_CLASS}
                        type="button"
                        aria-label={`Delete ${experience.role} at ${experience.company}`}
                        onClick={() => {
                          setDeleteError('');
                          setExperienceToDelete(experience);
                        }}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p role="status">No experience entries are available.</p>
          )
        ) : null}
      </section>

      {experienceToDelete ? (
        <div
          className="fixed inset-0 grid place-items-center bg-slate-950/65 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-experience-title"
        >
          <div className="grid max-w-md gap-4 border border-slate-300 bg-white p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 text-red-700" aria-hidden="true" />
              <div>
                <h2
                  className="m-0 text-xl font-semibold"
                  id="delete-experience-title"
                >
                  {deleteDialogTitle(experienceToDelete)}
                </h2>
                <p className="m-0 mt-2 text-slate-700">
                  This experience entry will be permanently deleted.
                </p>
              </div>
            </div>
            {deleteError ? (
              <p className="m-0 text-red-700" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className={BUTTON_CLASS}
                type="button"
                disabled={deleteExperienceMutation.isPending}
                onClick={() => setExperienceToDelete(null)}
              >
                <X size={18} aria-hidden="true" />
                Cancel
              </button>
              <button
                className={DANGER_BUTTON_CLASS}
                type="button"
                disabled={deleteExperienceMutation.isPending}
                onClick={confirmDelete}
              >
                <Trash2 size={18} aria-hidden="true" />
                {deleteExperienceMutation.isPending ? 'Deleting' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
