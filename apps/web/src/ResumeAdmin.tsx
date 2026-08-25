import { ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  FileText,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { RESUME_CONTENT_TYPE, RESUME_MAX_BYTES } from '@antin-os/shared';
import type { Resume } from '@antin-os/shared';
import {
  useDeleteResumeMutation,
  useUpdateResumePublicationMutation,
  useUploadResumeMutation,
} from './mutations/resume.mutations';
import { useResume } from './queries/resume.queries';

const PANEL_CLASS = 'border border-slate-300 bg-white p-5';
const BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-slate-400 bg-white px-3 py-2 text-slate-800 hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60';
const PRIMARY_BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-teal-700 bg-teal-700 px-3 py-2 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60';
const DANGER_BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-red-700 bg-white px-3 py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60';

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

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function validateResumeFile(file: File): string | null {
  if (file.size === 0) {
    return 'Choose a PDF file that is not empty.';
  }

  if (file.size > RESUME_MAX_BYTES) {
    return `Choose a PDF file smaller than ${formatFileSize(RESUME_MAX_BYTES)}.`;
  }

  if (file.type !== RESUME_CONTENT_TYPE) {
    return 'Choose a PDF file.';
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'The filename must end with .pdf.';
  }

  return null;
}

function ResumeMetadata({ resume }: { resume: Resume }) {
  const metadata = useMemo(
    () => [
      ['Filename', resume.originalFilename],
      ['Size', formatFileSize(resume.fileSize)],
      ['Uploaded', formatDate(resume.uploadedAt)],
      ['Updated', formatDate(resume.updatedAt)],
      ['State', resume.isPublic ? 'Public' : 'Private'],
    ],
    [resume],
  );

  return (
    <dl className="m-0 grid gap-3 md:grid-cols-2">
      {metadata.map(([label, value]) => (
        <div key={label} className="border border-slate-200 p-3">
          <dt className="text-sm font-semibold text-slate-600">{label}</dt>
          <dd className="m-0 break-words text-slate-950">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ResumeAdmin() {
  const resumeQuery = useResume();
  const uploadResumeMutation = useUploadResumeMutation();
  const updatePublicationMutation = useUpdateResumePublicationMutation();
  const deleteResumeMutation = useDeleteResumeMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resume = resumeQuery.data ?? null;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isReplaceConfirmOpen, setIsReplaceConfirmOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const isUploading = uploadResumeMutation.isPending;
  const isPublicationUpdating = updatePublicationMutation.isPending;
  const isDeleting = deleteResumeMutation.isPending;
  const hasPendingMutation = isUploading || isPublicationUpdating || isDeleting;

  function resetFileSelection() {
    setSelectedFile(null);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError('');
    setStatus('');
    setUploadProgress(0);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = validateResumeFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  }

  async function uploadSelectedFile() {
    if (!selectedFile || isUploading) {
      return;
    }

    if (resume && !isReplaceConfirmOpen) {
      setIsReplaceConfirmOpen(true);
      return;
    }

    setError('');
    setStatus('Uploading resume');

    try {
      await uploadResumeMutation.mutateAsync({
        file: selectedFile,
        fileName: selectedFile.name,
        onProgress: setUploadProgress,
      });
      setUploadProgress(100);
      setIsReplaceConfirmOpen(false);
      resetFileSelection();
      setStatus('Resume uploaded');
    } catch (uploadError) {
      setError(errorMessage(uploadError, 'Resume upload failed.'));
      setStatus('');
    }
  }

  async function togglePublication() {
    if (!resume || isPublicationUpdating) {
      return;
    }

    setError('');
    setStatus(resume.isPublic ? 'Unpublishing resume' : 'Publishing resume');

    try {
      await updatePublicationMutation.mutateAsync({
        isPublic: !resume.isPublic,
      });
      setStatus(resume.isPublic ? 'Resume unpublished' : 'Resume published');
    } catch (publicationError) {
      setError(
        errorMessage(publicationError, 'Resume publication update failed.'),
      );
      setStatus('');
    }
  }

  async function confirmRemove() {
    if (!resume || isDeleting) {
      return;
    }

    setError('');
    setStatus('Removing resume');

    try {
      await deleteResumeMutation.mutateAsync();
      setIsRemoveConfirmOpen(false);
      resetFileSelection();
      setStatus('Resume removed');
    } catch (deleteError) {
      setError(errorMessage(deleteError, 'Resume removal failed.'));
      setStatus('');
    }
  }

  return (
    <section className="grid gap-5" aria-label="Resume management">
      <section className={PANEL_CLASS} aria-labelledby="resume-title">
        <div className="grid gap-4">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2
                id="resume-title"
                className="m-0 text-[24px] font-semibold text-slate-950"
              >
                Resume
              </h2>
              <p className="m-0 text-slate-600">
                Upload one current PDF. New uploads stay private until
                published.
              </p>
            </div>
            {resume ? (
              <span className="inline-flex min-h-8 w-fit items-center border border-slate-300 px-2.5 text-sm font-semibold text-slate-700">
                {resume.isPublic ? 'Public' : 'Private'}
              </span>
            ) : null}
          </header>

          {resumeQuery.isLoading ? (
            <p
              className="m-0 border border-slate-200 bg-slate-50 p-4"
              role="status"
            >
              Loading resume
            </p>
          ) : null}

          {resumeQuery.isError ? (
            <div
              className="grid gap-3 border border-red-300 bg-red-50 p-4 text-red-700"
              role="alert"
            >
              <p className="m-0">
                {errorMessage(resumeQuery.error, 'Resume failed to load.')}
              </p>
              <button
                className={BUTTON_CLASS}
                type="button"
                onClick={() => void resumeQuery.refetch()}
              >
                <RotateCcw size={18} aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : null}

          {!resumeQuery.isLoading && !resumeQuery.isError && !resume ? (
            <p
              className="m-0 border border-slate-200 bg-slate-50 p-4"
              role="status"
            >
              No resume is available. Upload a PDF to get started.
            </p>
          ) : null}

          {resume ? <ResumeMetadata resume={resume} /> : null}

          <div className="grid gap-3 border border-slate-200 p-4">
            <label className="grid gap-1.5" htmlFor="resume-file">
              <span className="font-semibold">PDF file</span>
              <input
                ref={fileInputRef}
                id="resume-file"
                className="min-h-10 w-full border border-slate-400 px-2.5 py-2 font-[inherit]"
                type="file"
                accept="application/pdf,.pdf"
                aria-describedby="resume-file-help"
                disabled={hasPendingMutation}
                onChange={onFileChange}
              />
            </label>
            <p id="resume-file-help" className="m-0 text-sm text-slate-600">
              PDF only, up to {formatFileSize(RESUME_MAX_BYTES)}.
            </p>
            {selectedFile ? (
              <p className="m-0 text-sm text-slate-700">
                Selected {selectedFile.name} (
                {formatFileSize(selectedFile.size)})
              </p>
            ) : null}
            {isUploading ? (
              <div className="grid gap-1" role="status">
                <span>Uploading {uploadProgress}%</span>
                <progress
                  className="h-3 w-full"
                  max={100}
                  value={uploadProgress}
                  aria-label="Resume upload progress"
                />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                className={PRIMARY_BUTTON_CLASS}
                type="button"
                disabled={!selectedFile || hasPendingMutation}
                onClick={() => void uploadSelectedFile()}
              >
                <Upload size={18} aria-hidden="true" />
                {isUploading
                  ? 'Uploading'
                  : resume
                    ? 'Replace PDF'
                    : 'Upload PDF'}
              </button>
              {selectedFile ? (
                <button
                  className={BUTTON_CLASS}
                  type="button"
                  disabled={hasPendingMutation}
                  onClick={resetFileSelection}
                >
                  <X size={18} aria-hidden="true" />
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {resume ? (
            <div className="flex flex-wrap gap-2">
              <button
                className={BUTTON_CLASS}
                type="button"
                disabled={hasPendingMutation}
                onClick={() => void togglePublication()}
              >
                {resume.isPublic ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
                {isPublicationUpdating
                  ? 'Saving'
                  : resume.isPublic
                    ? 'Unpublish'
                    : 'Publish'}
              </button>
              <button
                className={DANGER_BUTTON_CLASS}
                type="button"
                disabled={hasPendingMutation}
                onClick={() => setIsRemoveConfirmOpen(true)}
              >
                <Trash2 size={18} aria-hidden="true" />
                Remove
              </button>
            </div>
          ) : null}

          {status ? (
            <p
              className="m-0 border border-teal-200 bg-teal-50 p-3 text-teal-800"
              role="status"
            >
              {status}
            </p>
          ) : null}

          {error ? (
            <p
              className="m-0 border border-red-300 bg-red-50 p-3 text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      </section>

      {isReplaceConfirmOpen && resume && selectedFile ? (
        <div
          className="fixed inset-0 z-20 grid place-items-center bg-slate-950/50 p-4"
          role="presentation"
        >
          <div
            className="grid max-w-md gap-4 border border-slate-300 bg-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="replace-resume-title"
          >
            <div>
              <h3
                id="replace-resume-title"
                className="m-0 text-[20px] font-semibold text-slate-950"
              >
                Replace {resume.originalFilename}?
              </h3>
              <p className="m-0 mt-2 text-slate-600">
                The new file {selectedFile.name} will replace the current resume
                and stay private until published.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className={BUTTON_CLASS}
                type="button"
                disabled={isUploading}
                onClick={() => setIsReplaceConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className={PRIMARY_BUTTON_CLASS}
                type="button"
                disabled={isUploading}
                onClick={() => void uploadSelectedFile()}
              >
                <FileText size={18} aria-hidden="true" />
                {isUploading ? 'Replacing' : 'Replace'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isRemoveConfirmOpen && resume ? (
        <div
          className="fixed inset-0 z-20 grid place-items-center bg-slate-950/50 p-4"
          role="presentation"
        >
          <div
            className="grid max-w-md gap-4 border border-slate-300 bg-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-resume-title"
          >
            <div>
              <h3
                id="remove-resume-title"
                className="m-0 text-[20px] font-semibold text-slate-950"
              >
                Remove {resume.originalFilename}?
              </h3>
              <p className="m-0 mt-2 text-slate-600">
                This removes the current resume from admin and public download.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className={BUTTON_CLASS}
                type="button"
                disabled={isDeleting}
                onClick={() => setIsRemoveConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className={DANGER_BUTTON_CLASS}
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmRemove()}
              >
                <Trash2 size={18} aria-hidden="true" />
                {isDeleting ? 'Removing' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
