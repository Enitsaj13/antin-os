import { FormEvent, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Certification,
  CreateCertificationInput,
  CreateEducationInput,
  Education,
} from '@antin-os/shared';
import {
  useCreateCertificationMutation,
  useCreateEducationMutation,
  useDeleteCertificationMutation,
  useDeleteEducationMutation,
  useReorderCertificationsMutation,
  useReorderEducationsMutation,
  useUpdateCertificationMutation,
  useUpdateEducationMutation,
  useUpdatePortfolioSettingsMutation,
} from './mutations/credentials.mutations';
import {
  useCertifications,
  useEducations,
  usePortfolioSettings,
} from './queries/credentials.queries';

type EducationFormValues = {
  institution: string;
  credential: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  summary: string;
  displayOrder: string;
  isPublic: boolean;
};

type CertificationFormValues = {
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate: string;
  credentialId: string;
  credentialUrl: string;
  summary: string;
  displayOrder: string;
  isPublic: boolean;
};

type EducationErrors = Partial<
  Record<keyof EducationFormValues | 'form', string>
>;
type CertificationErrors = Partial<
  Record<keyof CertificationFormValues | 'form', string>
>;

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

const EMPTY_EDUCATION: EducationFormValues = {
  institution: '',
  credential: '',
  fieldOfStudy: '',
  location: '',
  startDate: '',
  endDate: '',
  summary: '',
  displayOrder: '0',
  isPublic: false,
};

const EMPTY_CERTIFICATION: CertificationFormValues = {
  name: '',
  issuer: '',
  issueDate: '',
  expirationDate: '',
  credentialId: '',
  credentialUrl: '',
  summary: '',
  displayOrder: '0',
  isPublic: false,
};

type DeleteTarget =
  | { type: 'education'; record: Education }
  | { type: 'certification'; record: Certification };

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

function dateInput(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Present';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) {
    return 'Dates not set';
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function educationToForm(education: Education): EducationFormValues {
  return {
    institution: education.institution,
    credential: education.credential,
    fieldOfStudy: education.fieldOfStudy,
    location: education.location,
    startDate: dateInput(education.startDate),
    endDate: dateInput(education.endDate),
    summary: education.summary,
    displayOrder: String(education.displayOrder),
    isPublic: education.isPublic,
  };
}

function certificationToForm(
  certification: Certification,
): CertificationFormValues {
  return {
    name: certification.name,
    issuer: certification.issuer,
    issueDate: dateInput(certification.issueDate),
    expirationDate: dateInput(certification.expirationDate),
    credentialId: certification.credentialId ?? '',
    credentialUrl: certification.credentialUrl ?? '',
    summary: certification.summary,
    displayOrder: String(certification.displayOrder),
    isPublic: certification.isPublic,
  };
}

function educationInput(values: EducationFormValues): CreateEducationInput {
  return {
    institution: values.institution.trim(),
    credential: values.credential.trim(),
    fieldOfStudy: values.fieldOfStudy.trim(),
    location: values.location.trim(),
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    summary: values.summary.trim(),
    displayOrder: Number(values.displayOrder),
    isPublic: values.isPublic,
  };
}

function certificationInput(
  values: CertificationFormValues,
): CreateCertificationInput {
  return {
    name: values.name.trim(),
    issuer: values.issuer.trim(),
    issueDate: values.issueDate || null,
    expirationDate: values.expirationDate || null,
    credentialId: values.credentialId.trim() || null,
    credentialUrl: values.credentialUrl.trim() || null,
    summary: values.summary.trim(),
    displayOrder: Number(values.displayOrder),
    isPublic: values.isPublic,
  };
}

function validateDisplayOrder(value: string) {
  const displayOrder = Number(value);

  return (
    Number.isInteger(displayOrder) && displayOrder >= 0 && value.trim() !== ''
  );
}

function validateEducationForm(values: EducationFormValues): EducationErrors {
  const errors: EducationErrors = {};

  for (const key of [
    'institution',
    'credential',
    'fieldOfStudy',
    'location',
    'summary',
  ] as const) {
    if (!values[key].trim()) {
      errors[key] = 'This field is required.';
    }
  }

  if (
    values.startDate &&
    values.endDate &&
    new Date(values.endDate).getTime() < new Date(values.startDate).getTime()
  ) {
    errors.endDate = 'End date cannot be before start date.';
  }

  if (!validateDisplayOrder(values.displayOrder)) {
    errors.displayOrder = 'Display order must be a non-negative integer.';
  }

  return errors;
}

function validateCertificationForm(
  values: CertificationFormValues,
): CertificationErrors {
  const errors: CertificationErrors = {};

  for (const key of ['name', 'issuer', 'summary'] as const) {
    if (!values[key].trim()) {
      errors[key] = 'This field is required.';
    }
  }

  if (
    values.issueDate &&
    values.expirationDate &&
    new Date(values.expirationDate).getTime() <
      new Date(values.issueDate).getTime()
  ) {
    errors.expirationDate = 'Expiration date cannot be before issue date.';
  }

  if (values.credentialUrl.trim()) {
    try {
      new URL(values.credentialUrl.trim());
    } catch {
      errors.credentialUrl = 'Enter a valid URL.';
    }
  }

  if (!validateDisplayOrder(values.displayOrder)) {
    errors.displayOrder = 'Display order must be a non-negative integer.';
  }

  return errors;
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

function nextDisplayOrder(records: Array<{ displayOrder: number }>) {
  return records.length > 0
    ? Math.max(...records.map((record) => record.displayOrder)) + 1
    : 0;
}

export function CredentialsAdmin() {
  const settingsQuery = usePortfolioSettings();
  const educationsQuery = useEducations();
  const certificationsQuery = useCertifications();
  const updateSettingsMutation = useUpdatePortfolioSettingsMutation();
  const createEducationMutation = useCreateEducationMutation();
  const updateEducationMutation = useUpdateEducationMutation();
  const deleteEducationMutation = useDeleteEducationMutation();
  const reorderEducationsMutation = useReorderEducationsMutation();
  const createCertificationMutation = useCreateCertificationMutation();
  const updateCertificationMutation = useUpdateCertificationMutation();
  const deleteCertificationMutation = useDeleteCertificationMutation();
  const reorderCertificationsMutation = useReorderCertificationsMutation();
  const educations = educationsQuery.data ?? [];
  const certifications = certificationsQuery.data ?? [];
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [educationForm, setEducationForm] =
    useState<EducationFormValues>(EMPTY_EDUCATION);
  const [educationErrors, setEducationErrors] = useState<EducationErrors>({});
  const [editingEducationId, setEditingEducationId] = useState<string | null>(
    null,
  );
  const [educationListError, setEducationListError] = useState('');
  const [certificationForm, setCertificationForm] =
    useState<CertificationFormValues>(EMPTY_CERTIFICATION);
  const [certificationErrors, setCertificationErrors] =
    useState<CertificationErrors>({});
  const [editingCertificationId, setEditingCertificationId] = useState<
    string | null
  >(null);
  const [certificationListError, setCertificationListError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const sortedEducations = useMemo(
    () =>
      [...educations].sort(
        (first, second) =>
          first.displayOrder - second.displayOrder ||
          new Date(second.startDate ?? second.updatedAt).getTime() -
            new Date(first.startDate ?? first.updatedAt).getTime(),
      ),
    [educations],
  );
  const sortedCertifications = useMemo(
    () =>
      [...certifications].sort(
        (first, second) =>
          first.displayOrder - second.displayOrder ||
          new Date(second.issueDate ?? second.updatedAt).getTime() -
            new Date(first.issueDate ?? first.updatedAt).getTime(),
      ),
    [certifications],
  );

  const isSavingEducation =
    createEducationMutation.isPending || updateEducationMutation.isPending;
  const isSavingCertification =
    createCertificationMutation.isPending ||
    updateCertificationMutation.isPending;
  const isUpdatingSettings = updateSettingsMutation.isPending;

  function updateEducationField<K extends keyof EducationFormValues>(
    key: K,
    value: EducationFormValues[K],
  ) {
    setEducationErrors((current) => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }));
    setEducationForm((current) => ({ ...current, [key]: value }));
  }

  function updateCertificationField<K extends keyof CertificationFormValues>(
    key: K,
    value: CertificationFormValues[K],
  ) {
    setCertificationErrors((current) => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }));
    setCertificationForm((current) => ({ ...current, [key]: value }));
  }

  function startNewEducation() {
    setEditingEducationId(null);
    setEducationForm({
      ...EMPTY_EDUCATION,
      displayOrder: String(nextDisplayOrder(sortedEducations)),
    });
    setEducationErrors({});
  }

  function startNewCertification() {
    setEditingCertificationId(null);
    setCertificationForm({
      ...EMPTY_CERTIFICATION,
      displayOrder: String(nextDisplayOrder(sortedCertifications)),
    });
    setCertificationErrors({});
  }

  async function toggleSetting(
    key: 'showEducation' | 'showCertifications',
    value: boolean,
  ) {
    if (isUpdatingSettings) {
      return;
    }

    setSettingsMessage('');
    setSettingsError('');

    try {
      await updateSettingsMutation.mutateAsync({ [key]: value });
      setSettingsMessage('Visibility settings saved.');
    } catch (error) {
      setSettingsError(errorMessage(error, 'Visibility update failed.'));
    }
  }

  async function submitEducation(event: FormEvent) {
    event.preventDefault();

    if (isSavingEducation) {
      return;
    }

    const nextErrors = validateEducationForm(educationForm);
    setEducationErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      if (editingEducationId) {
        await updateEducationMutation.mutateAsync({
          id: editingEducationId,
          input: educationInput(educationForm),
        });
      } else {
        await createEducationMutation.mutateAsync(
          educationInput(educationForm),
        );
      }

      startNewEducation();
    } catch (error) {
      setEducationErrors({
        form: errorMessage(error, 'Education save failed.'),
      });
    }
  }

  async function submitCertification(event: FormEvent) {
    event.preventDefault();

    if (isSavingCertification) {
      return;
    }

    const nextErrors = validateCertificationForm(certificationForm);
    setCertificationErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      if (editingCertificationId) {
        await updateCertificationMutation.mutateAsync({
          id: editingCertificationId,
          input: certificationInput(certificationForm),
        });
      } else {
        await createCertificationMutation.mutateAsync(
          certificationInput(certificationForm),
        );
      }

      startNewCertification();
    } catch (error) {
      setCertificationErrors({
        form: errorMessage(error, 'Certification save failed.'),
      });
    }
  }

  async function toggleEducationPublication(education: Education) {
    if (updateEducationMutation.isPending) {
      return;
    }

    setEducationListError('');

    try {
      await updateEducationMutation.mutateAsync({
        id: education.id,
        input: { isPublic: !education.isPublic },
      });
    } catch (error) {
      setEducationListError(
        errorMessage(error, 'Education publication update failed.'),
      );
    }
  }

  async function toggleCertificationPublication(certification: Certification) {
    if (updateCertificationMutation.isPending) {
      return;
    }

    setCertificationListError('');

    try {
      await updateCertificationMutation.mutateAsync({
        id: certification.id,
        input: { isPublic: !certification.isPublic },
      });
    } catch (error) {
      setCertificationListError(
        errorMessage(error, 'Certification publication update failed.'),
      );
    }
  }

  async function moveEducation(education: Education, direction: -1 | 1) {
    if (reorderEducationsMutation.isPending) {
      return;
    }

    const currentIndex = sortedEducations.findIndex(
      (candidate) => candidate.id === education.id,
    );
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= educations.length) {
      return;
    }

    const reordered = [...sortedEducations];
    const [movedEducation] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, movedEducation);
    setEducationListError('');

    try {
      await reorderEducationsMutation.mutateAsync({
        items: reordered.map((item, index) => ({
          id: item.id,
          displayOrder: index,
        })),
      });
    } catch (error) {
      setEducationListError(errorMessage(error, 'Education reorder failed.'));
    }
  }

  async function moveCertification(
    certification: Certification,
    direction: -1 | 1,
  ) {
    if (reorderCertificationsMutation.isPending) {
      return;
    }

    const currentIndex = sortedCertifications.findIndex(
      (candidate) => candidate.id === certification.id,
    );
    const nextIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= certifications.length
    ) {
      return;
    }

    const reordered = [...sortedCertifications];
    const [movedCertification] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, movedCertification);
    setCertificationListError('');

    try {
      await reorderCertificationsMutation.mutateAsync({
        items: reordered.map((item, index) => ({
          id: item.id,
          displayOrder: index,
        })),
      });
    } catch (error) {
      setCertificationListError(
        errorMessage(error, 'Certification reorder failed.'),
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    if (
      deleteEducationMutation.isPending ||
      deleteCertificationMutation.isPending
    ) {
      return;
    }

    setDeleteError('');

    try {
      if (deleteTarget.type === 'education') {
        await deleteEducationMutation.mutateAsync(deleteTarget.record.id);
      } else {
        await deleteCertificationMutation.mutateAsync(deleteTarget.record.id);
      }

      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(errorMessage(error, 'Credential deletion failed.'));
    }
  }

  return (
    <section className="grid gap-5" aria-label="Credentials management">
      <section className={PANEL_CLASS} aria-labelledby="visibility-title">
        <header className="mb-4">
          <h2
            id="visibility-title"
            className="m-0 text-[24px] font-semibold text-slate-950"
          >
            Public section visibility
          </h2>
          <p className="m-0 mt-1 text-slate-600">
            Disabling a section hides it publicly without deleting entries or
            changing their individual publication state.
          </p>
        </header>

        {settingsQuery.isLoading ? (
          <p role="status">Loading visibility settings</p>
        ) : null}

        {settingsQuery.isError ? (
          <div
            className="grid gap-3 border border-red-300 bg-red-50 p-4"
            role="alert"
          >
            <p className="m-0">
              {errorMessage(
                settingsQuery.error,
                'Could not load visibility settings.',
              )}
            </p>
            <button
              className={BUTTON_CLASS}
              type="button"
              onClick={() => void settingsQuery.refetch()}
            >
              <RotateCcw size={18} aria-hidden="true" />
              Retry settings
            </button>
          </div>
        ) : null}

        {settingsMessage ? (
          <p className="m-0 mb-3 border border-teal-300 bg-teal-50 p-3 text-teal-800">
            {settingsMessage}
          </p>
        ) : null}
        {settingsError ? (
          <p
            className="m-0 mb-3 border border-red-300 bg-red-50 p-3 text-red-700"
            role="alert"
          >
            {settingsError}
          </p>
        ) : null}

        {settingsQuery.data ? (
          <div className="flex flex-wrap gap-3">
            <label className="flex min-h-10 items-center gap-3 border border-slate-300 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={settingsQuery.data.showEducation}
                disabled={isUpdatingSettings}
                onChange={(event) =>
                  void toggleSetting('showEducation', event.target.checked)
                }
              />
              <span>Show Education on public portfolio</span>
            </label>
            <label className="flex min-h-10 items-center gap-3 border border-slate-300 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={settingsQuery.data.showCertifications}
                disabled={isUpdatingSettings}
                onChange={(event) =>
                  void toggleSetting('showCertifications', event.target.checked)
                }
              />
              <span>Show Certifications on public portfolio</span>
            </label>
          </div>
        ) : null}
      </section>

      <CredentialFormPanel
        kind="education"
        title={editingEducationId ? 'Edit education' : 'New education'}
        description="New education entries stay private until you publish them."
        isSaving={isSavingEducation}
        errors={educationErrors}
        onNew={startNewEducation}
        onSubmit={submitEducation}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id="education-institution"
            label="Institution"
            value={educationForm.institution}
            error={educationErrors.institution}
            onChange={(value) => updateEducationField('institution', value)}
          />
          <TextField
            id="education-credential"
            label="Credential or degree"
            value={educationForm.credential}
            error={educationErrors.credential}
            onChange={(value) => updateEducationField('credential', value)}
          />
          <TextField
            id="education-field-of-study"
            label="Field of study"
            value={educationForm.fieldOfStudy}
            error={educationErrors.fieldOfStudy}
            onChange={(value) => updateEducationField('fieldOfStudy', value)}
          />
          <TextField
            id="education-location"
            label="Location"
            value={educationForm.location}
            error={educationErrors.location}
            onChange={(value) => updateEducationField('location', value)}
          />
          <DateField
            id="education-start-date"
            label="Start date"
            value={educationForm.startDate}
            error={educationErrors.startDate}
            onChange={(value) => updateEducationField('startDate', value)}
          />
          <DateField
            id="education-end-date"
            label="End date"
            value={educationForm.endDate}
            error={educationErrors.endDate}
            onChange={(value) => updateEducationField('endDate', value)}
          />
        </div>
        <TextareaField
          id="education-summary"
          label="Summary"
          value={educationForm.summary}
          error={educationErrors.summary}
          onChange={(value) => updateEducationField('summary', value)}
        />
        <FormFooter
          idPrefix="education"
          displayOrder={educationForm.displayOrder}
          displayOrderError={educationErrors.displayOrder}
          isPublic={educationForm.isPublic}
          onDisplayOrderChange={(value) =>
            updateEducationField('displayOrder', value)
          }
          onPublicChange={(value) => updateEducationField('isPublic', value)}
        />
      </CredentialFormPanel>

      <CredentialListPanel
        title="Education"
        description="Manage schools, degrees, publication state, and homepage order."
        isLoading={educationsQuery.isLoading}
        isError={educationsQuery.isError}
        error={educationsQuery.error}
        retry={() => void educationsQuery.refetch()}
        emptyText="No education entries are available."
        listError={educationListError}
      >
        {sortedEducations.length > 0 ? (
          <EducationList
            records={sortedEducations}
            isReordering={reorderEducationsMutation.isPending}
            isUpdating={updateEducationMutation.isPending}
            onMove={moveEducation}
            onTogglePublication={toggleEducationPublication}
            onEdit={(education) => {
              setEditingEducationId(education.id);
              setEducationForm(educationToForm(education));
              setEducationErrors({});
            }}
            onDelete={(education) => {
              setDeleteError('');
              setDeleteTarget({ type: 'education', record: education });
            }}
          />
        ) : null}
      </CredentialListPanel>

      <CredentialFormPanel
        kind="certification"
        title={
          editingCertificationId ? 'Edit certification' : 'New certification'
        }
        description="New certification entries stay private until you publish them."
        isSaving={isSavingCertification}
        errors={certificationErrors}
        onNew={startNewCertification}
        onSubmit={submitCertification}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id="certification-name"
            label="Name"
            value={certificationForm.name}
            error={certificationErrors.name}
            onChange={(value) => updateCertificationField('name', value)}
          />
          <TextField
            id="certification-issuer"
            label="Issuer"
            value={certificationForm.issuer}
            error={certificationErrors.issuer}
            onChange={(value) => updateCertificationField('issuer', value)}
          />
          <DateField
            id="certification-issue-date"
            label="Issue date"
            value={certificationForm.issueDate}
            error={certificationErrors.issueDate}
            onChange={(value) => updateCertificationField('issueDate', value)}
          />
          <DateField
            id="certification-expiration-date"
            label="Expiration date"
            value={certificationForm.expirationDate}
            error={certificationErrors.expirationDate}
            onChange={(value) =>
              updateCertificationField('expirationDate', value)
            }
          />
          <TextField
            id="certification-credential-id"
            label="Credential ID"
            value={certificationForm.credentialId}
            error={certificationErrors.credentialId}
            onChange={(value) =>
              updateCertificationField('credentialId', value)
            }
          />
          <TextField
            id="certification-credential-url"
            label="Credential URL"
            value={certificationForm.credentialUrl}
            error={certificationErrors.credentialUrl}
            onChange={(value) =>
              updateCertificationField('credentialUrl', value)
            }
          />
        </div>
        <TextareaField
          id="certification-summary"
          label="Summary"
          value={certificationForm.summary}
          error={certificationErrors.summary}
          onChange={(value) => updateCertificationField('summary', value)}
        />
        <FormFooter
          idPrefix="certification"
          displayOrder={certificationForm.displayOrder}
          displayOrderError={certificationErrors.displayOrder}
          isPublic={certificationForm.isPublic}
          onDisplayOrderChange={(value) =>
            updateCertificationField('displayOrder', value)
          }
          onPublicChange={(value) =>
            updateCertificationField('isPublic', value)
          }
        />
      </CredentialFormPanel>

      <CredentialListPanel
        title="Certifications"
        description="Manage credentials, publication state, and homepage order."
        isLoading={certificationsQuery.isLoading}
        isError={certificationsQuery.isError}
        error={certificationsQuery.error}
        retry={() => void certificationsQuery.refetch()}
        emptyText="No certification entries are available."
        listError={certificationListError}
      >
        {sortedCertifications.length > 0 ? (
          <CertificationList
            records={sortedCertifications}
            isReordering={reorderCertificationsMutation.isPending}
            isUpdating={updateCertificationMutation.isPending}
            onMove={moveCertification}
            onTogglePublication={toggleCertificationPublication}
            onEdit={(certification) => {
              setEditingCertificationId(certification.id);
              setCertificationForm(certificationToForm(certification));
              setCertificationErrors({});
            }}
            onDelete={(certification) => {
              setDeleteError('');
              setDeleteTarget({
                type: 'certification',
                record: certification,
              });
            }}
          />
        ) : null}
      </CredentialListPanel>

      {deleteTarget ? (
        <DeleteDialog
          target={deleteTarget}
          error={deleteError}
          isDeleting={
            deleteEducationMutation.isPending ||
            deleteCertificationMutation.isPending
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </section>
  );
}

function CredentialFormPanel({
  title,
  description,
  isSaving,
  errors,
  onNew,
  onSubmit,
  children,
}: {
  kind: 'education' | 'certification';
  title: string;
  description: string;
  isSaving: boolean;
  errors: { form?: string };
  onNew: () => void;
  onSubmit: (event: FormEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <section className={PANEL_CLASS} aria-labelledby={`${title}-title`}>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              id={`${title}-title`}
              className="m-0 text-[24px] font-semibold text-slate-950"
            >
              {title}
            </h2>
            <p className="m-0 text-slate-600">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={BUTTON_CLASS}
              type="button"
              disabled={isSaving}
              onClick={onNew}
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

        {children}
      </form>
    </section>
  );
}

function TextField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={FIELD_CLASS}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={INPUT_CLASS}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={FIELD_CLASS}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={INPUT_CLASS}
        type="date"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

function TextareaField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={FIELD_CLASS}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        className={`${INPUT_CLASS} min-h-24 resize-y`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

function FormFooter({
  idPrefix,
  displayOrder,
  displayOrderError,
  isPublic,
  onDisplayOrderChange,
  onPublicChange,
}: {
  idPrefix: string;
  displayOrder: string;
  displayOrderError?: string;
  isPublic: boolean;
  onDisplayOrderChange: (value: string) => void;
  onPublicChange: (value: boolean) => void;
}) {
  const orderId = `${idPrefix}-display-order`;

  return (
    <div className="flex flex-wrap gap-3">
      <div className={FIELD_CLASS}>
        <label htmlFor={orderId}>Display order</label>
        <input
          id={orderId}
          className={`${INPUT_CLASS} max-w-32`}
          type="number"
          min={0}
          step={1}
          aria-invalid={Boolean(displayOrderError)}
          aria-describedby={displayOrderError ? `${orderId}-error` : undefined}
          value={displayOrder}
          onChange={(event) => onDisplayOrderChange(event.target.value)}
        />
        <ErrorText id={`${orderId}-error`} message={displayOrderError} />
      </div>

      <label className="mt-6 flex max-w-max items-center gap-3 border border-slate-300 bg-slate-50 px-3 py-2">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => onPublicChange(event.target.checked)}
        />
        <span>{isPublic ? 'Public' : 'Private'}</span>
      </label>
    </div>
  );
}

function CredentialListPanel({
  title,
  description,
  isLoading,
  isError,
  error,
  retry,
  emptyText,
  listError,
  children,
}: {
  title: string;
  description: string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  emptyText: string;
  listError: string;
  children: React.ReactNode;
}) {
  return (
    <section className={PANEL_CLASS} aria-labelledby={`${title}-list-title`}>
      <header className="mb-5">
        <h2
          id={`${title}-list-title`}
          className="m-0 text-[24px] font-semibold text-slate-950"
        >
          {title}
        </h2>
        <p className="m-0 text-slate-600">{description}</p>
      </header>

      {listError ? (
        <p
          className="mb-4 border border-red-300 bg-red-50 p-3 text-red-700"
          role="alert"
        >
          {listError}
        </p>
      ) : null}

      {isLoading ? <p role="status">Loading {title.toLowerCase()}</p> : null}

      {isError ? (
        <div
          className="grid gap-3 border border-red-300 bg-red-50 p-4"
          role="alert"
        >
          <p className="m-0">
            {errorMessage(error, `Could not load ${title.toLowerCase()}.`)}
          </p>
          <button className={BUTTON_CLASS} type="button" onClick={retry}>
            <RotateCcw size={18} aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !isError
        ? children || <p role="status">{emptyText}</p>
        : null}
    </section>
  );
}

function EducationList({
  records,
  isReordering,
  isUpdating,
  onMove,
  onTogglePublication,
  onEdit,
  onDelete,
}: {
  records: Education[];
  isReordering: boolean;
  isUpdating: boolean;
  onMove: (education: Education, direction: -1 | 1) => void;
  onTogglePublication: (education: Education) => void;
  onEdit: (education: Education) => void;
  onDelete: (education: Education) => void;
}) {
  return (
    <div className="grid gap-3">
      <table className="hidden min-w-full border-collapse text-left md:table">
        <thead>
          <tr className="border-b border-slate-300">
            <th className="py-2 pr-3">Institution</th>
            <th className="py-2 pr-3">Credential</th>
            <th className="py-2 pr-3">Dates</th>
            <th className="py-2 pr-3">State</th>
            <th className="py-2 pr-3">Order</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((education, index) => (
            <tr className="border-b border-slate-200" key={education.id}>
              <td className="py-3 pr-3 font-medium">{education.institution}</td>
              <td className="py-3 pr-3">
                {education.credential}, {education.fieldOfStudy}
              </td>
              <td className="py-3 pr-3">
                {formatRange(education.startDate, education.endDate)}
              </td>
              <td className="py-3 pr-3">
                {education.isPublic ? 'Public' : 'Private'}
              </td>
              <td className="py-3 pr-3">{education.displayOrder}</td>
              <td className="py-3">
                <RowActions
                  label={`${education.credential} at ${education.institution}`}
                  isFirst={index === 0}
                  isLast={index === records.length - 1}
                  isPublic={education.isPublic}
                  isReordering={isReordering}
                  isUpdating={isUpdating}
                  onMove={(direction) => onMove(education, direction)}
                  onTogglePublication={() => onTogglePublication(education)}
                  onEdit={() => onEdit(education)}
                  onDelete={() => onDelete(education)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid gap-3 md:hidden">
        {records.map((education, index) => (
          <article
            className="grid gap-2 border border-slate-300 p-3"
            key={education.id}
          >
            <div>
              <h3 className="m-0 text-lg font-semibold">
                {education.credential}
              </h3>
              <p className="m-0 text-sm text-slate-600">
                {education.institution}
              </p>
            </div>
            <p className="m-0">Field: {education.fieldOfStudy}</p>
            <p className="m-0">
              Dates: {formatRange(education.startDate, education.endDate)}
            </p>
            <p className="m-0">
              State: {education.isPublic ? 'Public' : 'Private'}
            </p>
            <p className="m-0">Order: {education.displayOrder}</p>
            <RowActions
              label={`${education.credential} at ${education.institution}`}
              isFirst={index === 0}
              isLast={index === records.length - 1}
              isPublic={education.isPublic}
              isReordering={isReordering}
              isUpdating={isUpdating}
              onMove={(direction) => onMove(education, direction)}
              onTogglePublication={() => onTogglePublication(education)}
              onEdit={() => onEdit(education)}
              onDelete={() => onDelete(education)}
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function CertificationList({
  records,
  isReordering,
  isUpdating,
  onMove,
  onTogglePublication,
  onEdit,
  onDelete,
}: {
  records: Certification[];
  isReordering: boolean;
  isUpdating: boolean;
  onMove: (certification: Certification, direction: -1 | 1) => void;
  onTogglePublication: (certification: Certification) => void;
  onEdit: (certification: Certification) => void;
  onDelete: (certification: Certification) => void;
}) {
  return (
    <div className="grid gap-3">
      <table className="hidden min-w-full border-collapse text-left md:table">
        <thead>
          <tr className="border-b border-slate-300">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Issuer</th>
            <th className="py-2 pr-3">Dates</th>
            <th className="py-2 pr-3">State</th>
            <th className="py-2 pr-3">Order</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((certification, index) => (
            <tr className="border-b border-slate-200" key={certification.id}>
              <td className="py-3 pr-3 font-medium">{certification.name}</td>
              <td className="py-3 pr-3">{certification.issuer}</td>
              <td className="py-3 pr-3">
                {formatRange(
                  certification.issueDate,
                  certification.expirationDate,
                )}
              </td>
              <td className="py-3 pr-3">
                {certification.isPublic ? 'Public' : 'Private'}
              </td>
              <td className="py-3 pr-3">{certification.displayOrder}</td>
              <td className="py-3">
                <RowActions
                  label={`${certification.name} from ${certification.issuer}`}
                  isFirst={index === 0}
                  isLast={index === records.length - 1}
                  isPublic={certification.isPublic}
                  isReordering={isReordering}
                  isUpdating={isUpdating}
                  onMove={(direction) => onMove(certification, direction)}
                  onTogglePublication={() => onTogglePublication(certification)}
                  onEdit={() => onEdit(certification)}
                  onDelete={() => onDelete(certification)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid gap-3 md:hidden">
        {records.map((certification, index) => (
          <article
            className="grid gap-2 border border-slate-300 p-3"
            key={certification.id}
          >
            <div>
              <h3 className="m-0 text-lg font-semibold">
                {certification.name}
              </h3>
              <p className="m-0 text-sm text-slate-600">
                {certification.issuer}
              </p>
            </div>
            <p className="m-0">
              Dates:{' '}
              {formatRange(
                certification.issueDate,
                certification.expirationDate,
              )}
            </p>
            <p className="m-0">
              State: {certification.isPublic ? 'Public' : 'Private'}
            </p>
            <p className="m-0">Order: {certification.displayOrder}</p>
            <RowActions
              label={`${certification.name} from ${certification.issuer}`}
              isFirst={index === 0}
              isLast={index === records.length - 1}
              isPublic={certification.isPublic}
              isReordering={isReordering}
              isUpdating={isUpdating}
              onMove={(direction) => onMove(certification, direction)}
              onTogglePublication={() => onTogglePublication(certification)}
              onEdit={() => onEdit(certification)}
              onDelete={() => onDelete(certification)}
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function RowActions({
  label,
  isFirst,
  isLast,
  isPublic,
  isReordering,
  isUpdating,
  onMove,
  onTogglePublication,
  onEdit,
  onDelete,
}: {
  label: string;
  isFirst: boolean;
  isLast: boolean;
  isPublic: boolean;
  isReordering: boolean;
  isUpdating: boolean;
  onMove: (direction: -1 | 1) => void;
  onTogglePublication: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        className={BUTTON_CLASS}
        type="button"
        aria-label={`Move ${label} up`}
        disabled={isFirst || isReordering}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={16} aria-hidden="true" />
      </button>
      <button
        className={BUTTON_CLASS}
        type="button"
        aria-label={`Move ${label} down`}
        disabled={isLast || isReordering}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={16} aria-hidden="true" />
      </button>
      <button
        className={BUTTON_CLASS}
        type="button"
        aria-label={isPublic ? `Unpublish ${label}` : `Publish ${label}`}
        disabled={isUpdating}
        onClick={onTogglePublication}
      >
        {isPublic ? 'Unpublish' : 'Publish'}
      </button>
      <button
        className={BUTTON_CLASS}
        type="button"
        aria-label={`Edit ${label}`}
        onClick={onEdit}
      >
        <Edit3 size={16} aria-hidden="true" />
        Edit
      </button>
      <button
        className={DANGER_BUTTON_CLASS}
        type="button"
        aria-label={`Delete ${label}`}
        onClick={onDelete}
      >
        <Trash2 size={16} aria-hidden="true" />
        Delete
      </button>
    </div>
  );
}

function DeleteDialog({
  target,
  error,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  target: DeleteTarget;
  error: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title =
    target.type === 'education'
      ? `Delete ${target.record.credential} at ${target.record.institution}?`
      : `Delete ${target.record.name} from ${target.record.issuer}?`;

  return (
    <div
      className="fixed inset-0 grid place-items-center bg-slate-950/65 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-credential-title"
    >
      <div className="grid max-w-md gap-4 border border-slate-300 bg-white p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 text-red-700" aria-hidden="true" />
          <div>
            <h2
              className="m-0 text-xl font-semibold"
              id="delete-credential-title"
            >
              {title}
            </h2>
            <p className="m-0 mt-2 text-slate-700">
              This credential entry will be permanently deleted.
            </p>
          </div>
        </div>
        {error ? (
          <p className="m-0 text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            className={BUTTON_CLASS}
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
          >
            <X size={18} aria-hidden="true" />
            Cancel
          </button>
          <button
            className={DANGER_BUTTON_CLASS}
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            <Trash2 size={18} aria-hidden="true" />
            {isDeleting ? 'Deleting' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
