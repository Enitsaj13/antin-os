import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Edit3,
  ImagePlus,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  PROJECT_IMAGE_MAX_BYTES,
  PROJECT_IMAGE_MIME_TYPES,
  slugify,
} from '@antin-os/shared';
import type { CreateProjectInput, Project } from '@antin-os/shared';
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectMutation,
  useUploadProjectImageMutation,
} from './mutations/project.mutations';
import { useProject, useProjects } from './queries/project.queries';

type Navigate = (path: string) => void;
type ProjectFilter = 'all' | 'public' | 'unpublished';
type ProjectFormMode = 'create' | 'edit';
type ProjectFormValues = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  techStack: string;
  repoUrl: string;
  liveUrl: string;
  imageUrl: string;
  imageKey: string;
  isPublic: boolean;
};

type FormErrors = Partial<Record<keyof ProjectFormValues | 'form', string>>;

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

const EMPTY_PROJECT: ProjectFormValues = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  techStack: '',
  repoUrl: '',
  liveUrl: '',
  imageUrl: '',
  imageKey: '',
  isPublic: false,
};

const PROJECT_IMAGE_ACCEPT = PROJECT_IMAGE_MIME_TYPES.join(',');

function formatDate(value: string) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();

  if (!message) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(message) as {
      message?: string | string[];
      statusCode?: number;
    };

    if (parsed.statusCode === 409) {
      return 'A project with this slug already exists.';
    }

    if (Array.isArray(parsed.message)) {
      return parsed.message.join(' ');
    }

    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    // Fall back to string matching below.
  }

  if (message.includes('409') || message.toLowerCase().includes('slug')) {
    return 'A project with this slug already exists.';
  }

  return message;
}

function splitTechStack(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function optionalUrl(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function projectToForm(project: Project): ProjectFormValues {
  return {
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    description: project.description ?? '',
    techStack: project.techStack.join(', '),
    repoUrl: project.repoUrl ?? '',
    liveUrl: project.liveUrl ?? '',
    imageUrl: project.imageUrl ?? '',
    imageKey: project.imageKey ?? '',
    isPublic: project.isPublic,
  };
}

function toProjectInput(values: ProjectFormValues): CreateProjectInput {
  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    summary: values.summary.trim(),
    description: optionalUrl(values.description),
    techStack: splitTechStack(values.techStack),
    repoUrl: optionalUrl(values.repoUrl),
    liveUrl: optionalUrl(values.liveUrl),
    imageUrl: values.imageKey ? null : optionalUrl(values.imageUrl),
    imageKey: values.imageKey.trim() || null,
    isPublic: values.isPublic,
  };
}

function validateProjectForm(values: ProjectFormValues): FormErrors {
  const errors: FormErrors = {};
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (!values.slug.trim()) {
    errors.slug = 'Slug is required.';
  } else if (!slugPattern.test(values.slug.trim())) {
    errors.slug = 'Use lowercase kebab-case, for example portfolio-api.';
  }

  if (!values.summary.trim()) {
    errors.summary = 'Summary is required.';
  }

  if (splitTechStack(values.techStack).length === 0) {
    errors.techStack = 'Add at least one technology.';
  }

  for (const key of ['repoUrl', 'liveUrl', 'imageUrl'] as const) {
    const value = values[key].trim();

    if (!value) {
      continue;
    }

    try {
      new URL(value);
    } catch {
      errors[key] = 'Enter a valid URL.';
    }
  }

  return errors;
}

function hasIncompletePublicInfo(values: ProjectFormValues) {
  return (
    values.isPublic &&
    (!values.description.trim() ||
      !values.repoUrl.trim() ||
      !values.liveUrl.trim() ||
      (!values.imageUrl.trim() && !values.imageKey.trim()))
  );
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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

export function ProjectsAdmin({ onNavigate }: { onNavigate: Navigate }) {
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const projectsQuery = useProjects();
  const deleteProjectMutation = useDeleteProjectMutation();
  const projects = projectsQuery.data ?? [];

  const filteredProjects = useMemo(() => {
    if (filter === 'public') {
      return projects.filter((project) => project.isPublic);
    }

    if (filter === 'unpublished') {
      return projects.filter((project) => !project.isPublic);
    }

    return projects;
  }, [filter, projects]);

  async function confirmDelete() {
    if (!projectToDelete || deleteProjectMutation.isPending) {
      return;
    }

    setDeleteError('');

    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      setProjectToDelete(null);
    } catch (error) {
      setDeleteError(errorMessage(error, 'Project deletion failed.'));
    }
  }

  return (
    <section className={PANEL_CLASS} aria-label="Projects management">
      <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="m-0 text-[24px] font-semibold text-slate-950">
            Projects
          </h2>
          <p className="m-0 text-slate-600">
            Manage portfolio projects and publication state.
          </p>
        </div>
        <button
          className={PRIMARY_BUTTON_CLASS}
          type="button"
          onClick={() => onNavigate('/admin/projects/new')}
        >
          <Plus size={18} aria-hidden="true" />
          New project
        </button>
      </header>

      <div
        className="mb-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Project filters"
      >
        {[
          ['all', 'All'],
          ['public', 'Public'],
          ['unpublished', 'Unpublished'],
        ].map(([value, label]) => (
          <button
            className={filter === value ? PRIMARY_BUTTON_CLASS : BUTTON_CLASS}
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value as ProjectFilter)}
          >
            {label}
          </button>
        ))}
      </div>

      {projectsQuery.isLoading ? <p role="status">Loading projects</p> : null}

      {projectsQuery.isError ? (
        <div
          className="grid gap-3 border border-red-300 bg-red-50 p-4"
          role="alert"
        >
          <p className="m-0">
            {errorMessage(projectsQuery.error, 'Could not load projects.')}
          </p>
          <button
            className={BUTTON_CLASS}
            type="button"
            onClick={() => void projectsQuery.refetch()}
          >
            <RotateCcw size={18} aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : null}

      {!projectsQuery.isLoading && !projectsQuery.isError ? (
        filteredProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="hidden min-w-full border-collapse text-left md:table">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">Tech stack</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3">Updated</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr className="border-b border-slate-200" key={project.id}>
                    <td className="py-3 pr-3 font-medium">{project.title}</td>
                    <td className="py-3 pr-3">{project.slug}</td>
                    <td className="py-3 pr-3">
                      {project.techStack.join(', ')}
                    </td>
                    <td className="py-3 pr-3">
                      {project.isPublic ? 'Public' : 'Private'}
                    </td>
                    <td className="py-3 pr-3">
                      {formatDate(project.updatedAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className={BUTTON_CLASS}
                          type="button"
                          aria-label={`Edit ${project.title}`}
                          onClick={() =>
                            onNavigate(`/admin/projects/${project.id}/edit`)
                          }
                        >
                          <Edit3 size={16} aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          className={DANGER_BUTTON_CLASS}
                          type="button"
                          aria-label={`Delete ${project.title}`}
                          onClick={() => {
                            setDeleteError('');
                            setProjectToDelete(project);
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
              {filteredProjects.map((project) => (
                <article
                  className="grid gap-2 border border-slate-300 p-3"
                  key={project.id}
                >
                  <div>
                    <h3 className="m-0 text-lg font-semibold">
                      {project.title}
                    </h3>
                    <p className="m-0 text-sm text-slate-600">{project.slug}</p>
                  </div>
                  <p className="m-0">
                    Tech stack: {project.techStack.join(', ')}
                  </p>
                  <p className="m-0">
                    State: {project.isPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="m-0">
                    Updated: {formatDate(project.updatedAt)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={BUTTON_CLASS}
                      type="button"
                      aria-label={`Edit ${project.title}`}
                      onClick={() =>
                        onNavigate(`/admin/projects/${project.id}/edit`)
                      }
                    >
                      <Edit3 size={16} aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      className={DANGER_BUTTON_CLASS}
                      type="button"
                      aria-label={`Delete ${project.title}`}
                      onClick={() => {
                        setDeleteError('');
                        setProjectToDelete(project);
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
          <p role="status">No matching projects are available.</p>
        )
      ) : null}

      {projectToDelete ? (
        <div
          className="fixed inset-0 grid place-items-center bg-slate-950/65 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
        >
          <div className="grid max-w-md gap-4 border border-slate-300 bg-white p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 text-red-700" aria-hidden="true" />
              <div>
                <h2
                  className="m-0 text-xl font-semibold"
                  id="delete-project-title"
                >
                  Delete {projectToDelete.title}?
                </h2>
                <p className="m-0 mt-2 text-slate-700">
                  This project will be permanently deleted.
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
                disabled={deleteProjectMutation.isPending}
                onClick={() => setProjectToDelete(null)}
              >
                <X size={18} aria-hidden="true" />
                Cancel
              </button>
              <button
                className={DANGER_BUTTON_CLASS}
                type="button"
                disabled={deleteProjectMutation.isPending}
                onClick={confirmDelete}
              >
                <Trash2 size={18} aria-hidden="true" />
                {deleteProjectMutation.isPending ? 'Deleting' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ProjectFormPage({
  mode,
  projectId,
  onNavigate,
}: {
  mode: ProjectFormMode;
  projectId?: string;
  onNavigate: Navigate;
}) {
  const isEdit = mode === 'edit';
  const projectQuery = useProject(isEdit ? (projectId ?? '') : '');
  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const uploadProjectImageMutation = useUploadProjectImageMutation();
  const [form, setForm] = useState<ProjectFormValues>(EMPTY_PROJECT);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPublishWarning, setShowPublishWarning] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(
    null,
  );
  const [imageUploadStatus, setImageUploadStatus] = useState('');

  useEffect(() => {
    if (isEdit && projectQuery.data) {
      setForm(projectToForm(projectQuery.data));
      setSlugManuallyEdited(true);
    }
  }, [isEdit, projectQuery.data]);

  const isPending =
    createProjectMutation.isPending ||
    updateProjectMutation.isPending ||
    uploadProjectImageMutation.isPending;

  function updateField<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) {
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    setForm((current) => {
      if (key === 'title' && !slugManuallyEdited) {
        return {
          ...current,
          title: value as string,
          slug: slugify(value as string),
        };
      }

      if (key === 'slug') {
        setSlugManuallyEdited(true);
      }

      return { ...current, [key]: value };
    });
  }

  async function submitProject(skipPublishWarning = false) {
    const nextErrors = validateProjectForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!skipPublishWarning && hasIncompletePublicInfo(form)) {
      setShowPublishWarning(true);
      return;
    }

    setShowPublishWarning(false);

    try {
      if (isEdit) {
        await updateProjectMutation.mutateAsync({
          id: projectId ?? '',
          input: toProjectInput(form),
        });
      } else {
        await createProjectMutation.mutateAsync(toProjectInput(form));
      }

      onNavigate('/admin/projects');
    } catch (error) {
      setErrors({
        form: errorMessage(error, 'Project save failed.'),
      });
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isPending) {
      void submitProject();
    }
  }

  async function uploadProjectImage(file: File) {
    setErrors((current) => ({
      ...current,
      imageUrl: undefined,
      form: undefined,
    }));

    if (
      !PROJECT_IMAGE_MIME_TYPES.includes(
        file.type as (typeof PROJECT_IMAGE_MIME_TYPES)[number],
      )
    ) {
      setErrors((current) => ({
        ...current,
        imageUrl: 'Use a JPEG, PNG, or WebP image.',
      }));
      return;
    }

    if (file.size > PROJECT_IMAGE_MAX_BYTES) {
      setErrors((current) => ({
        ...current,
        imageUrl: `Use an image smaller than ${formatFileSize(PROJECT_IMAGE_MAX_BYTES)}.`,
      }));
      return;
    }

    setImageUploadProgress(0);
    setImageUploadStatus('Uploading project image');

    try {
      const upload = await uploadProjectImageMutation.mutateAsync({
        file,
        fileName: file.name,
        contentType: file.type,
        onProgress: setImageUploadProgress,
      });

      setForm((current) => ({
        ...current,
        imageKey: upload.key,
        imageUrl: upload.imageUrl,
      }));
      setImageUploadStatus('Project image uploaded');
    } catch (error) {
      setImageUploadStatus('');
      setErrors((current) => ({
        ...current,
        imageUrl: errorMessage(error, 'Project image upload failed.'),
      }));
    }
  }

  function onProjectImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    if (file) {
      void uploadProjectImage(file);
    }
  }

  function removeProjectImage() {
    setForm((current) => ({
      ...current,
      imageUrl: '',
      imageKey: '',
    }));
    setImageUploadProgress(null);
    setImageUploadStatus('Project image removed from form');
    setErrors((current) => ({
      ...current,
      imageUrl: undefined,
      form: undefined,
    }));
  }

  if (isEdit && projectQuery.isLoading) {
    return (
      <section className={PANEL_CLASS} aria-label="Project form">
        <p role="status">Loading project</p>
      </section>
    );
  }

  if (isEdit && projectQuery.isError) {
    return (
      <section className={PANEL_CLASS} aria-label="Project form">
        <div
          className="grid gap-3 border border-red-300 bg-red-50 p-4"
          role="alert"
        >
          <p className="m-0">
            {errorMessage(projectQuery.error, 'Could not load project.')}
          </p>
          <button
            className={BUTTON_CLASS}
            type="button"
            onClick={() => void projectQuery.refetch()}
          >
            <RotateCcw size={18} aria-hidden="true" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={PANEL_CLASS} aria-label="Project form">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="m-0 text-[24px] font-semibold text-slate-950">
              {isEdit ? 'Edit project' : 'New project'}
            </h2>
            <p className="m-0 text-slate-600">
              {isEdit
                ? 'Update project details and publication state.'
                : 'Create a private project draft by default.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={BUTTON_CLASS}
              type="button"
              disabled={isPending}
              onClick={() => onNavigate('/admin/projects')}
            >
              <X size={18} aria-hidden="true" />
              Cancel
            </button>
            <button
              className={PRIMARY_BUTTON_CLASS}
              type="submit"
              disabled={isPending}
            >
              <Save size={18} aria-hidden="true" />
              {isPending ? 'Saving' : 'Save'}
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
            <label htmlFor="project-title">Title</label>
            <input
              id="project-title"
              className={INPUT_CLASS}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={
                errors.title ? 'project-title-error' : undefined
              }
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
            <ErrorText id="project-title-error" message={errors.title} />
          </div>

          <div className={FIELD_CLASS}>
            <label htmlFor="project-slug">Slug</label>
            <input
              id="project-slug"
              className={INPUT_CLASS}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? 'project-slug-error' : undefined}
              value={form.slug}
              onChange={(event) => updateField('slug', event.target.value)}
            />
            <ErrorText id="project-slug-error" message={errors.slug} />
          </div>
        </div>

        <div className={FIELD_CLASS}>
          <label htmlFor="project-summary">Summary</label>
          <textarea
            id="project-summary"
            className={`${INPUT_CLASS} min-h-24 resize-y`}
            aria-invalid={Boolean(errors.summary)}
            aria-describedby={
              errors.summary ? 'project-summary-error' : undefined
            }
            value={form.summary}
            onChange={(event) => updateField('summary', event.target.value)}
          />
          <ErrorText id="project-summary-error" message={errors.summary} />
        </div>

        <div className={FIELD_CLASS}>
          <label htmlFor="project-description">Description</label>
          <textarea
            id="project-description"
            className={`${INPUT_CLASS} min-h-32 resize-y`}
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </div>

        <div className={FIELD_CLASS}>
          <label htmlFor="project-tech-stack">Tech stack</label>
          <input
            id="project-tech-stack"
            className={INPUT_CLASS}
            aria-invalid={Boolean(errors.techStack)}
            aria-describedby={
              errors.techStack ? 'project-tech-stack-error' : undefined
            }
            value={form.techStack}
            onChange={(event) => updateField('techStack', event.target.value)}
          />
          <span className="text-sm text-slate-600">
            Separate technologies with commas.
          </span>
          <ErrorText id="project-tech-stack-error" message={errors.techStack} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={FIELD_CLASS}>
            <label htmlFor="project-repo-url">Repository URL</label>
            <input
              id="project-repo-url"
              className={INPUT_CLASS}
              aria-invalid={Boolean(errors.repoUrl)}
              aria-describedby={
                errors.repoUrl ? 'project-repo-url-error' : undefined
              }
              value={form.repoUrl}
              onChange={(event) => updateField('repoUrl', event.target.value)}
            />
            <ErrorText id="project-repo-url-error" message={errors.repoUrl} />
          </div>

          <div className={FIELD_CLASS}>
            <label htmlFor="project-live-url">Live URL</label>
            <input
              id="project-live-url"
              className={INPUT_CLASS}
              aria-invalid={Boolean(errors.liveUrl)}
              aria-describedby={
                errors.liveUrl ? 'project-live-url-error' : undefined
              }
              value={form.liveUrl}
              onChange={(event) => updateField('liveUrl', event.target.value)}
            />
            <ErrorText id="project-live-url-error" message={errors.liveUrl} />
          </div>
        </div>

        <div className={FIELD_CLASS}>
          <label htmlFor="project-image-file">Project image</label>
          <div className="grid gap-3 border border-slate-300 p-3 md:grid-cols-[180px_1fr] md:items-center">
            <div className="grid aspect-video place-items-center overflow-hidden border border-slate-300 bg-slate-100">
              {form.imageUrl ? (
                <img
                  className="h-full w-full object-cover"
                  src={form.imageUrl}
                  alt={`${form.title || 'Project'} preview`}
                />
              ) : (
                <span className="text-sm text-slate-600">No image</span>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className={BUTTON_CLASS} htmlFor="project-image-file">
                  <ImagePlus size={18} aria-hidden="true" />
                  Upload image
                </label>
                {form.imageUrl ? (
                  <button
                    className={BUTTON_CLASS}
                    type="button"
                    disabled={isPending}
                    onClick={removeProjectImage}
                  >
                    <X size={18} aria-hidden="true" />
                    Remove image
                  </button>
                ) : null}
              </div>
              <input
                id="project-image-file"
                className="sr-only"
                type="file"
                accept={PROJECT_IMAGE_ACCEPT}
                aria-invalid={Boolean(errors.imageUrl)}
                aria-describedby={
                  errors.imageUrl ? 'project-image-url-error' : undefined
                }
                disabled={isPending}
                onChange={onProjectImageChange}
              />
              <p className="m-0 text-sm text-slate-600">
                Upload JPEG, PNG, or WebP up to{' '}
                {formatFileSize(PROJECT_IMAGE_MAX_BYTES)}.
              </p>
              {imageUploadProgress !== null ? (
                <progress
                  aria-label="Project image upload progress"
                  className="h-2 w-full"
                  max={100}
                  value={imageUploadProgress}
                />
              ) : null}
              {imageUploadStatus ? (
                <p className="m-0 text-sm text-slate-700" role="status">
                  {imageUploadStatus}
                </p>
              ) : null}
              <ErrorText
                id="project-image-url-error"
                message={errors.imageUrl}
              />
            </div>
          </div>
        </div>

        <label className="flex max-w-max items-center gap-3 border border-slate-300 bg-slate-50 px-3 py-2">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(event) => updateField('isPublic', event.target.checked)}
          />
          <span>{form.isPublic ? 'Public' : 'Private'}</span>
        </label>
      </form>

      {showPublishWarning ? (
        <div
          className="fixed inset-0 grid place-items-center bg-slate-950/65 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-warning-title"
        >
          <div className="grid max-w-md gap-4 border border-slate-300 bg-white p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-1 text-amber-700"
                aria-hidden="true"
              />
              <div>
                <h2
                  className="m-0 text-xl font-semibold"
                  id="publish-warning-title"
                >
                  Publish incomplete project?
                </h2>
                <p className="m-0 mt-2 text-slate-700">
                  Description, repository URL, live URL, or project image is
                  empty. You can publish anyway after confirming.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className={BUTTON_CLASS}
                type="button"
                onClick={() => setShowPublishWarning(false)}
              >
                Keep editing
              </button>
              <button
                className={PRIMARY_BUTTON_CLASS}
                type="button"
                disabled={isPending}
                onClick={() => void submitProject(true)}
              >
                <Check size={18} aria-hidden="true" />
                Publish anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
