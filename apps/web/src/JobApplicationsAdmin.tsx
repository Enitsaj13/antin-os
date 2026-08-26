import {
  ArrowLeft,
  Columns3,
  LayoutDashboard,
  List,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  JOB_APPLICATION_STATUSES,
  JOB_APPLICATION_TEXT_LIMITS,
  type CreateJobApplicationInput,
  type JobApplication,
  type JobApplicationStatus,
} from '@antin-os/shared';
import { jobApplicationErrorMessage } from './job-application-errors';
import {
  useCreateJobApplicationMutation,
  useDeleteJobApplicationMutation,
  useUpdateJobApplicationMutation,
} from './mutations/job-application.mutations';
import {
  useJobApplication,
  useJobApplicationDashboard,
  useJobApplications,
} from './queries/job-application.queries';

const PANEL_CLASS = 'border border-slate-300 bg-white p-5 shadow-sm';
const INPUT_CLASS =
  'min-h-11 w-full border border-slate-400 bg-white px-3 py-2 text-slate-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-slate-100';
const BUTTON_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 border border-slate-400 bg-white px-3 py-2 font-medium text-slate-800 hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60';
const PRIMARY_BUTTON_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 border border-teal-800 bg-teal-800 px-3 py-2 font-medium text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60';
const DANGER_BUTTON_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 border border-red-700 bg-red-700 px-3 py-2 font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60';

export const JOB_APPLICATION_STATUS_LABELS: Record<
  JobApplicationStatus,
  string
> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

type Navigate = (path: string) => void;

type FormValues = {
  company: string;
  position: string;
  jobUrl: string;
  source: string;
  salaryRange: string;
  notes: string;
  status: JobApplicationStatus;
  applicationDate: string;
  interviewDate: string;
  nextActionDate: string;
  followUpNotes: string;
};

type FormErrors = Partial<Record<keyof FormValues | 'form', string>>;

const EMPTY_FORM: FormValues = {
  company: '',
  position: '',
  jobUrl: '',
  source: '',
  salaryRange: '',
  notes: '',
  status: 'saved',
  applicationDate: '',
  interviewDate: '',
  nextActionDate: '',
  followUpNotes: '',
};

function dateInput(value: string | null) {
  return value?.slice(0, 10) ?? '';
}

function toFormValues(application: JobApplication): FormValues {
  return {
    company: application.company,
    position: application.position,
    jobUrl: application.jobUrl ?? '',
    source: application.source ?? '',
    salaryRange: application.salaryRange ?? '',
    notes: application.notes ?? '',
    status: application.status,
    applicationDate: dateInput(application.applicationDate),
    interviewDate: dateInput(application.interviewDate),
    nextActionDate: dateInput(application.nextActionDate),
    followUpNotes: application.followUpNotes ?? '',
  };
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toInput(values: FormValues): CreateJobApplicationInput {
  return {
    company: values.company.trim(),
    position: values.position.trim(),
    jobUrl: nullableText(values.jobUrl),
    source: nullableText(values.source),
    salaryRange: nullableText(values.salaryRange),
    notes: nullableText(values.notes),
    status: values.status,
    applicationDate: values.applicationDate || null,
    interviewDate: values.interviewDate || null,
    nextActionDate: values.nextActionDate || null,
    followUpNotes: nullableText(values.followUpNotes),
  };
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateJobApplicationForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.company.trim()) {
    errors.company = 'Company is required.';
  } else if (
    values.company.trim().length > JOB_APPLICATION_TEXT_LIMITS.company
  ) {
    errors.company = `Company must be ${JOB_APPLICATION_TEXT_LIMITS.company} characters or fewer.`;
  }

  if (!values.position.trim()) {
    errors.position = 'Position is required.';
  } else if (
    values.position.trim().length > JOB_APPLICATION_TEXT_LIMITS.position
  ) {
    errors.position = `Position must be ${JOB_APPLICATION_TEXT_LIMITS.position} characters or fewer.`;
  }

  if (values.jobUrl.trim() && !validHttpUrl(values.jobUrl.trim())) {
    errors.jobUrl = 'Job URL must be an absolute HTTP or HTTPS URL.';
  }

  for (const field of [
    'jobUrl',
    'source',
    'salaryRange',
    'notes',
    'followUpNotes',
  ] as const) {
    if (values[field].trim().length > JOB_APPLICATION_TEXT_LIMITS[field]) {
      errors[field] =
        `Keep this field to ${JOB_APPLICATION_TEXT_LIMITS[field]} characters or fewer.`;
    }
  }

  return errors;
}

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="m-0 text-sm text-red-700" id={id}>
      {message}
    </p>
  ) : null;
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="m-0 text-sm font-semibold uppercase tracking-wide text-teal-700">
          Private workspace
        </p>
        <h2 className="m-0 text-[28px] font-semibold text-slate-950">
          {title}
        </h2>
        <p className="m-0 max-w-3xl text-slate-600">{description}</p>
      </div>
      {action}
    </header>
  );
}

function JobApplicationNavigation({
  active,
  onNavigate,
}: {
  active: 'dashboard' | 'table' | 'kanban';
  onNavigate: Navigate;
}) {
  const items = [
    {
      key: 'dashboard' as const,
      label: 'Dashboard',
      path: '/admin/job-applications',
      icon: LayoutDashboard,
    },
    {
      key: 'table' as const,
      label: 'Table',
      path: '/admin/job-applications/table',
      icon: List,
    },
    {
      key: 'kanban' as const,
      label: 'Kanban',
      path: '/admin/job-applications/kanban',
      icon: Columns3,
    },
  ];

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Job application views">
      {items.map(({ key, label, path, icon: Icon }) => (
        <button
          className={active === key ? PRIMARY_BUTTON_CLASS : BUTTON_CLASS}
          key={key}
          type="button"
          aria-current={active === key ? 'page' : undefined}
          onClick={() => onNavigate(path)}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  );
}

export function JobApplicationsDashboard({
  onNavigate,
}: {
  onNavigate: Navigate;
}) {
  const summaryQuery = useJobApplicationDashboard();
  const summary = summaryQuery.data;

  return (
    <section className="grid gap-5" aria-label="Job application dashboard">
      <PageHeader
        title="Job applications"
        description="Review your private pipeline and next steps. Nothing here appears on the public portfolio."
        action={
          <button
            className={PRIMARY_BUTTON_CLASS}
            type="button"
            onClick={() => onNavigate('/admin/job-applications/new')}
          >
            <Plus size={18} aria-hidden="true" />
            New application
          </button>
        }
      />
      <JobApplicationNavigation active="dashboard" onNavigate={onNavigate} />

      {summaryQuery.isLoading ? <p role="status">Loading dashboard</p> : null}
      {summaryQuery.isError ? (
        <div
          className="grid gap-3 border border-red-300 bg-red-50 p-4"
          role="alert"
        >
          <p className="m-0">
            {jobApplicationErrorMessage(
              summaryQuery.error,
              'Could not load the job application dashboard.',
            )}
          </p>
          <button
            className={BUTTON_CLASS}
            type="button"
            onClick={() => void summaryQuery.refetch()}
          >
            <RotateCcw size={18} aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : null}

      {summary ? (
        <>
          <section className={PANEL_CLASS} aria-labelledby="application-total">
            <p className="m-0 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Total applications
            </p>
            <p
              id="application-total"
              className="m-0 text-[44px] font-semibold leading-tight text-slate-950"
            >
              {summary.total}
            </p>
            {summary.total === 0 ? (
              <p className="mb-0 text-slate-600">
                No job applications yet. Add the first opportunity when you are
                ready.
              </p>
            ) : (
              <p className="mb-0 text-slate-600">
                Pipeline progress is based on the confirmed status distribution
                below.
              </p>
            )}
          </section>

          <section
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Counts by status"
          >
            {JOB_APPLICATION_STATUSES.map((status) => {
              const count = summary.counts[status];
              const percentage =
                summary.total > 0
                  ? Math.round((count / summary.total) * 100)
                  : 0;

              return (
                <article className={PANEL_CLASS} key={status}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="m-0 text-lg font-semibold text-slate-950">
                      {JOB_APPLICATION_STATUS_LABELS[status]}
                    </h3>
                    <span className="text-2xl font-semibold text-teal-800">
                      {count}
                    </span>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden bg-slate-200"
                    role="progressbar"
                    aria-label={`${JOB_APPLICATION_STATUS_LABELS[status]} pipeline distribution`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <div
                      className="h-full bg-teal-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mb-0 text-sm text-slate-600">
                    {percentage}% of applications
                  </p>
                </article>
              );
            })}
          </section>
        </>
      ) : null}
    </section>
  );
}

function StatusSelect({
  application,
  disabled,
  onChange,
}: {
  application: JobApplication;
  disabled: boolean;
  onChange: (status: JobApplicationStatus) => void;
}) {
  return (
    <select
      className={INPUT_CLASS}
      aria-label={`Status for ${application.position} at ${application.company}`}
      value={application.status}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as JobApplicationStatus)}
    >
      {JOB_APPLICATION_STATUSES.map((status) => (
        <option key={status} value={status}>
          {JOB_APPLICATION_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}

export function JobApplicationsList({
  view,
  onNavigate,
}: {
  view: 'table' | 'kanban';
  onNavigate: Navigate;
}) {
  const applicationsQuery = useJobApplications();
  const updateMutation = useUpdateJobApplicationMutation();
  const deleteMutation = useDeleteJobApplicationMutation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    JobApplicationStatus | 'all'
  >('all');
  const [feedback, setFeedback] = useState('');
  const [applicationToDelete, setApplicationToDelete] =
    useState<JobApplication | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const applications = applicationsQuery.data ?? [];

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return applications.filter((application) => {
      if (statusFilter !== 'all' && application.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        application.company,
        application.position,
        application.source ?? '',
        application.salaryRange ?? '',
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [applications, search, statusFilter]);

  async function changeStatus(
    application: JobApplication,
    status: JobApplicationStatus,
  ) {
    if (status === application.status || updateMutation.isPending) {
      return;
    }

    setFeedback('');

    try {
      await updateMutation.mutateAsync({
        id: application.id,
        input: { status },
      });
    } catch (error) {
      setFeedback(
        jobApplicationErrorMessage(
          error,
          'Status update failed. The last confirmed status was restored.',
        ),
      );
    }
  }

  async function confirmDelete() {
    if (!applicationToDelete || deleteMutation.isPending) {
      return;
    }

    setDeleteError('');

    try {
      await deleteMutation.mutateAsync(applicationToDelete.id);
      setApplicationToDelete(null);
    } catch (error) {
      setDeleteError(
        jobApplicationErrorMessage(
          error,
          'Deletion failed. The application was not removed.',
        ),
      );
    }
  }

  return (
    <section className="grid gap-5" aria-label={`${view} job application view`}>
      <PageHeader
        title={view === 'table' ? 'Application table' : 'Application Kanban'}
        description={
          view === 'table'
            ? 'Search, filter, review, edit, and delete private application records.'
            : 'Review every pipeline group and move applications with accessible status controls.'
        }
        action={
          <button
            className={PRIMARY_BUTTON_CLASS}
            type="button"
            onClick={() => onNavigate('/admin/job-applications/new')}
          >
            <Plus size={18} aria-hidden="true" />
            New application
          </button>
        }
      />
      <JobApplicationNavigation active={view} onNavigate={onNavigate} />

      <section
        className={`${PANEL_CLASS} grid gap-4`}
        aria-label="Application filters"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label
            className="grid gap-1 font-medium"
            htmlFor="application-search"
          >
            Search
            <input
              id="application-search"
              className={INPUT_CLASS}
              type="search"
              value={search}
              placeholder="Company, position, source, or salary"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label
            className="grid gap-1 font-medium"
            htmlFor="application-status-filter"
          >
            Status
            <select
              id="application-status-filter"
              className={INPUT_CLASS}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as JobApplicationStatus | 'all',
                )
              }
            >
              <option value="all">All statuses</option>
              {JOB_APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {JOB_APPLICATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {feedback ? (
        <p
          className="m-0 border border-red-300 bg-red-50 p-3 text-red-700"
          role="alert"
        >
          {feedback}
        </p>
      ) : null}
      {applicationsQuery.isLoading ? (
        <p role="status">Loading applications</p>
      ) : null}
      {applicationsQuery.isError ? (
        <div
          className="grid gap-3 border border-red-300 bg-red-50 p-4"
          role="alert"
        >
          <p className="m-0">
            {jobApplicationErrorMessage(
              applicationsQuery.error,
              'Could not load job applications.',
            )}
          </p>
          <button
            className={BUTTON_CLASS}
            type="button"
            onClick={() => void applicationsQuery.refetch()}
          >
            <RotateCcw size={18} aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : null}

      {!applicationsQuery.isLoading && !applicationsQuery.isError ? (
        filteredApplications.length > 0 ? (
          view === 'table' ? (
            <ApplicationTable
              applications={filteredApplications}
              deleting={deleteMutation.isPending}
              onDelete={setApplicationToDelete}
              onEdit={(application) =>
                onNavigate(`/admin/job-applications/${application.id}/edit`)
              }
            />
          ) : (
            <ApplicationKanban
              applications={filteredApplications}
              updating={updateMutation.isPending}
              onChangeStatus={changeStatus}
              onEdit={(application) =>
                onNavigate(`/admin/job-applications/${application.id}/edit`)
              }
            />
          )
        ) : (
          <div className={PANEL_CLASS}>
            <h3 className="mt-0 text-xl font-semibold text-slate-950">
              {applications.length === 0
                ? 'No job applications yet'
                : 'No applications match these filters'}
            </h3>
            <p className="mb-0 text-slate-600">
              {applications.length === 0
                ? 'Create an application to start your private pipeline.'
                : 'Clear the search or choose another status.'}
            </p>
          </div>
        )
      ) : null}

      {applicationToDelete ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-job-application-title"
        >
          <section className="w-full max-w-lg border border-slate-400 bg-white p-5 shadow-xl">
            <h3
              id="delete-job-application-title"
              className="mt-0 text-xl font-semibold text-slate-950"
            >
              Delete {applicationToDelete.position} at{' '}
              {applicationToDelete.company}?
            </h3>
            <p>
              This permanently removes the application and cannot be undone.
            </p>
            {deleteError ? (
              <p
                className="border border-red-300 bg-red-50 p-3 text-red-700"
                role="alert"
              >
                {deleteError}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className={BUTTON_CLASS}
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  setApplicationToDelete(null);
                  setDeleteError('');
                }}
              >
                Cancel
              </button>
              <button
                className={DANGER_BUTTON_CLASS}
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => void confirmDelete()}
              >
                <Trash2 size={18} aria-hidden="true" />
                {deleteMutation.isPending ? 'Deleting' : 'Delete permanently'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ApplicationTable({
  applications,
  deleting,
  onEdit,
  onDelete,
}: {
  applications: JobApplication[];
  deleting: boolean;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
}) {
  return (
    <section className={PANEL_CLASS} aria-label="Job application records">
      <table className="hidden w-full border-collapse text-left text-sm md:table">
        <thead>
          <tr className="border-b border-slate-300">
            <th className="py-2 pr-3">Company / position</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Source / salary</th>
            <th className="py-2 pr-3">Application</th>
            <th className="py-2 pr-3">Interview</th>
            <th className="py-2 pr-3">Next action</th>
            <th className="py-2 pr-3">Updated</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr
              className="border-b border-slate-200 align-top"
              key={application.id}
            >
              <td className="py-3 pr-3">
                <strong className="block text-slate-950">
                  {application.company}
                </strong>
                <span>{application.position}</span>
              </td>
              <td className="py-3 pr-3">
                {JOB_APPLICATION_STATUS_LABELS[application.status]}
              </td>
              <td className="py-3 pr-3">
                <span className="block">{application.source ?? '—'}</span>
                <span>{application.salaryRange ?? '—'}</span>
              </td>
              <td className="py-3 pr-3">
                {formatDate(application.applicationDate)}
              </td>
              <td className="py-3 pr-3">
                {formatDate(application.interviewDate)}
              </td>
              <td className="py-3 pr-3">
                {formatDate(application.nextActionDate)}
              </td>
              <td className="py-3 pr-3">{formatDate(application.updatedAt)}</td>
              <td className="py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    className={BUTTON_CLASS}
                    type="button"
                    aria-label={`Edit ${application.position} at ${application.company}`}
                    onClick={() => onEdit(application)}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    className={BUTTON_CLASS}
                    type="button"
                    disabled={deleting}
                    aria-label={`Delete ${application.position} at ${application.company}`}
                    onClick={() => onDelete(application)}
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
        {applications.map((application) => (
          <article
            className="grid min-w-0 gap-3 border border-slate-300 p-4"
            key={application.id}
          >
            <div>
              <h3 className="m-0 break-words text-lg font-semibold text-slate-950">
                {application.position}
              </h3>
              <p className="m-0 break-words text-slate-700">
                {application.company}
              </p>
            </div>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="font-semibold">Status</dt>
              <dd className="m-0">
                {JOB_APPLICATION_STATUS_LABELS[application.status]}
              </dd>
              <dt className="font-semibold">Source</dt>
              <dd className="m-0 break-words">{application.source ?? '—'}</dd>
              <dt className="font-semibold">Salary</dt>
              <dd className="m-0 break-words">
                {application.salaryRange ?? '—'}
              </dd>
              <dt className="font-semibold">Applied</dt>
              <dd className="m-0">{formatDate(application.applicationDate)}</dd>
              <dt className="font-semibold">Interview</dt>
              <dd className="m-0">{formatDate(application.interviewDate)}</dd>
              <dt className="font-semibold">Next action</dt>
              <dd className="m-0">{formatDate(application.nextActionDate)}</dd>
              <dt className="font-semibold">Updated</dt>
              <dd className="m-0">{formatDate(application.updatedAt)}</dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button
                className={BUTTON_CLASS}
                type="button"
                onClick={() => onEdit(application)}
              >
                <Pencil size={16} aria-hidden="true" />
                Edit
              </button>
              <button
                className={BUTTON_CLASS}
                type="button"
                disabled={deleting}
                onClick={() => onDelete(application)}
              >
                <Trash2 size={16} aria-hidden="true" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ApplicationKanban({
  applications,
  updating,
  onChangeStatus,
  onEdit,
}: {
  applications: JobApplication[];
  updating: boolean;
  onChangeStatus: (
    application: JobApplication,
    status: JobApplicationStatus,
  ) => void;
  onEdit: (application: JobApplication) => void;
}) {
  return (
    <section
      className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3"
      aria-label="Job application Kanban board"
    >
      {JOB_APPLICATION_STATUSES.map((status) => {
        const group = applications.filter(
          (application) => application.status === status,
        );

        return (
          <section
            className={`${PANEL_CLASS} min-w-0`}
            key={status}
            aria-labelledby={`kanban-${status}`}
          >
            <header className="mb-3 flex items-center justify-between gap-3 border-b border-slate-300 pb-3">
              <h3
                id={`kanban-${status}`}
                className="m-0 text-lg font-semibold text-slate-950"
              >
                {JOB_APPLICATION_STATUS_LABELS[status]}
              </h3>
              <span aria-label={`${group.length} applications`}>
                {group.length}
              </span>
            </header>
            {group.length > 0 ? (
              <div className="grid gap-3">
                {group.map((application) => (
                  <article
                    className="grid min-w-0 gap-3 border border-slate-300 bg-slate-50 p-3"
                    key={application.id}
                  >
                    <div>
                      <h4 className="m-0 break-words font-semibold text-slate-950">
                        {application.position}
                      </h4>
                      <p className="m-0 break-words text-sm text-slate-700">
                        {application.company}
                      </p>
                    </div>
                    <p className="m-0 text-sm text-slate-600">
                      Next action: {formatDate(application.nextActionDate)}
                    </p>
                    <StatusSelect
                      application={application}
                      disabled={updating}
                      onChange={(nextStatus) =>
                        onChangeStatus(application, nextStatus)
                      }
                    />
                    <button
                      className={BUTTON_CLASS}
                      type="button"
                      onClick={() => onEdit(application)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Edit
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mb-0 text-sm text-slate-500">No applications</p>
            )}
          </section>
        );
      })}
    </section>
  );
}

export function JobApplicationForm({
  mode,
  applicationId = '',
  onNavigate,
}: {
  mode: 'create' | 'edit';
  applicationId?: string;
  onNavigate: Navigate;
}) {
  const detailQuery = useJobApplication(mode === 'edit' ? applicationId : '');
  const createMutation = useCreateJobApplicationMutation();
  const updateMutation = useUpdateJobApplicationMutation();
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (mode === 'edit' && detailQuery.data) {
      setForm(toFormValues(detailQuery.data));
    }
  }, [detailQuery.data, mode]);

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setSuccess('');
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const nextErrors = validateJobApplicationForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(toInput(form));
        setSuccess('Application created.');
        setForm(EMPTY_FORM);
      } else {
        await updateMutation.mutateAsync({
          id: applicationId,
          input: toInput(form),
        });
        setSuccess('Application updated.');
      }
    } catch (error) {
      setErrors({
        form: jobApplicationErrorMessage(
          error,
          `Could not ${mode === 'create' ? 'create' : 'update'} the application. Your entries are still here.`,
        ),
      });
    }
  }

  if (mode === 'edit' && detailQuery.isLoading) {
    return <p role="status">Loading application</p>;
  }

  if (mode === 'edit' && detailQuery.isError) {
    return (
      <div
        className="grid gap-3 border border-red-300 bg-red-50 p-4"
        role="alert"
      >
        <p className="m-0">
          {jobApplicationErrorMessage(
            detailQuery.error,
            'Could not load this application.',
          )}
        </p>
        <button
          className={BUTTON_CLASS}
          type="button"
          onClick={() => void detailQuery.refetch()}
        >
          <RotateCcw size={18} aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="grid gap-5" aria-label={`${mode} job application`}>
      <PageHeader
        title={mode === 'create' ? 'New application' : 'Edit application'}
        description="Dates are explicit facts: changing status never fills or clears them automatically."
        action={
          <button
            className={BUTTON_CLASS}
            type="button"
            disabled={isPending}
            onClick={() => onNavigate('/admin/job-applications/table')}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to applications
          </button>
        }
      />

      <form
        className={`${PANEL_CLASS} grid gap-5`}
        onSubmit={submit}
        noValidate
      >
        {errors.form ? (
          <p
            className="m-0 border border-red-300 bg-red-50 p-3 text-red-700"
            role="alert"
          >
            {errors.form}
          </p>
        ) : null}
        {success ? (
          <p
            className="m-0 border border-teal-300 bg-teal-50 p-3 text-teal-900"
            role="status"
          >
            {success}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Company" id="job-company" error={errors.company}>
            <input
              id="job-company"
              className={INPUT_CLASS}
              disabled={isPending}
              aria-invalid={Boolean(errors.company)}
              aria-describedby={
                errors.company ? 'job-company-error' : undefined
              }
              value={form.company}
              onChange={(event) => updateField('company', event.target.value)}
            />
          </FormField>
          <FormField label="Position" id="job-position" error={errors.position}>
            <input
              id="job-position"
              className={INPUT_CLASS}
              disabled={isPending}
              aria-invalid={Boolean(errors.position)}
              aria-describedby={
                errors.position ? 'job-position-error' : undefined
              }
              value={form.position}
              onChange={(event) => updateField('position', event.target.value)}
            />
          </FormField>
          <FormField label="Job URL" id="job-url" error={errors.jobUrl}>
            <input
              id="job-url"
              className={INPUT_CLASS}
              type="url"
              disabled={isPending}
              aria-invalid={Boolean(errors.jobUrl)}
              aria-describedby={errors.jobUrl ? 'job-url-error' : undefined}
              value={form.jobUrl}
              onChange={(event) => updateField('jobUrl', event.target.value)}
            />
          </FormField>
          <FormField label="Status" id="job-status" error={errors.status}>
            <select
              id="job-status"
              className={INPUT_CLASS}
              disabled={isPending}
              value={form.status}
              onChange={(event) =>
                updateField(
                  'status',
                  event.target.value as JobApplicationStatus,
                )
              }
            >
              {JOB_APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {JOB_APPLICATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Source" id="job-source" error={errors.source}>
            <input
              id="job-source"
              className={INPUT_CLASS}
              disabled={isPending}
              aria-invalid={Boolean(errors.source)}
              aria-describedby={errors.source ? 'job-source-error' : undefined}
              value={form.source}
              onChange={(event) => updateField('source', event.target.value)}
            />
          </FormField>
          <FormField
            label="Salary range"
            id="job-salary"
            error={errors.salaryRange}
          >
            <input
              id="job-salary"
              className={INPUT_CLASS}
              disabled={isPending}
              aria-invalid={Boolean(errors.salaryRange)}
              aria-describedby={
                errors.salaryRange ? 'job-salary-error' : undefined
              }
              value={form.salaryRange}
              onChange={(event) =>
                updateField('salaryRange', event.target.value)
              }
            />
          </FormField>
          <FormField
            label="Application date"
            id="job-application-date"
            error={errors.applicationDate}
          >
            <input
              id="job-application-date"
              className={INPUT_CLASS}
              type="date"
              disabled={isPending}
              value={form.applicationDate}
              onChange={(event) =>
                updateField('applicationDate', event.target.value)
              }
            />
          </FormField>
          <FormField
            label="Interview date"
            id="job-interview-date"
            error={errors.interviewDate}
          >
            <input
              id="job-interview-date"
              className={INPUT_CLASS}
              type="date"
              disabled={isPending}
              value={form.interviewDate}
              onChange={(event) =>
                updateField('interviewDate', event.target.value)
              }
            />
          </FormField>
          <FormField
            label="Next-action date"
            id="job-next-action-date"
            error={errors.nextActionDate}
          >
            <input
              id="job-next-action-date"
              className={INPUT_CLASS}
              type="date"
              disabled={isPending}
              value={form.nextActionDate}
              onChange={(event) =>
                updateField('nextActionDate', event.target.value)
              }
            />
          </FormField>
        </div>

        <FormField label="Notes" id="job-notes" error={errors.notes}>
          <textarea
            id="job-notes"
            className={`${INPUT_CLASS} min-h-28 resize-y`}
            disabled={isPending}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? 'job-notes-error' : undefined}
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
          />
        </FormField>
        <FormField
          label="Follow-up notes"
          id="job-follow-up-notes"
          error={errors.followUpNotes}
        >
          <textarea
            id="job-follow-up-notes"
            className={`${INPUT_CLASS} min-h-28 resize-y`}
            disabled={isPending}
            aria-invalid={Boolean(errors.followUpNotes)}
            aria-describedby={
              errors.followUpNotes ? 'job-follow-up-notes-error' : undefined
            }
            value={form.followUpNotes}
            onChange={(event) =>
              updateField('followUpNotes', event.target.value)
            }
          />
        </FormField>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            className={PRIMARY_BUTTON_CLASS}
            type="submit"
            disabled={isPending}
          >
            <Save size={18} aria-hidden="true" />
            {isPending
              ? 'Saving'
              : mode === 'create'
                ? 'Create application'
                : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}

function FormField({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 font-medium">
      <label htmlFor={id}>{label}</label>
      {children}
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}
