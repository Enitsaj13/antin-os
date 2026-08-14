import {
  ChangeEvent,
  FormEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Check, Save, Trash2, Upload, X } from 'lucide-react';
import { PROFILE_PICTURE_MIME_TYPES } from '@antin-os/shared';
import { useProfile } from './queries/profile.queries';
import {
  useRemoveProfilePictureMutation,
  useSaveProfileMutation,
  useUploadProfilePictureMutation,
} from './mutations/profile.mutations';
import type { Profile, ProfileFormValues } from '@antin-os/shared';
import {
  constrainCrop,
  createCroppedImage,
  minCoveredZoom,
  OUTPUT_SIZE,
} from './crop';
import type { CropState } from './crop';
import './styles.css';

const EMPTY_PROFILE: ProfileFormValues = {
  fullName: '',
  headline: '',
  biography: '',
  location: '',
  email: '',
  githubUrl: null,
  linkedinUrl: null,
};

const ACCEPTED_IMAGE_TYPES = [...PROFILE_PICTURE_MIME_TYPES];
const CROP_SIZE = 320;
const PANEL_CLASS = 'border border-slate-300 bg-white p-5';
const BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-slate-800 hover:border-teal-700';
const FIELD_CLASS = 'mb-3.5 grid gap-1.5';
const INPUT_CLASS =
  'min-h-10 w-full border border-slate-400 px-2.5 py-2 font-[inherit]';

function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function App() {
  const [form, setForm] = useState<ProfileFormValues>(EMPTY_PROFILE);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropState | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const profileQuery = useProfile();
  const saveProfileMutation = useSaveProfileMutation();
  const uploadPictureMutation = useUploadProfilePictureMutation();
  const removePictureMutation = useRemoveProfilePictureMutation();
  const profile = profileQuery.data ?? null;

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName,
        headline: profile.headline,
        biography: profile.biography,
        location: profile.location,
        email: profile.email,
        githubUrl: profile.githubUrl,
        linkedinUrl: profile.linkedinUrl,
      });
    }
  }, [profile]);

  const cropStyle = useMemo(() => {
    if (!crop || !sourceUrl) {
      return {};
    }

    return {
      backgroundImage: `url(${sourceUrl})`,
      backgroundSize: `${crop.imageWidth * crop.zoom}px ${crop.imageHeight * crop.zoom}px`,
      backgroundPosition: `calc(50% + ${crop.offsetX}px) calc(50% + ${crop.offsetY}px)`,
    };
  }, [crop, sourceUrl]);

  function updateForm<K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('Saving profile');

    try {
      await saveProfileMutation.mutateAsync({
        ...form,
        githubUrl: normalizeOptionalUrl(form.githubUrl ?? ''),
        linkedinUrl: normalizeOptionalUrl(form.linkedinUrl ?? ''),
      });
      setStatus('Profile saved');
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Profile save failed',
      );
      setStatus('');
    }
  }

  function onFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError('');

    if (!file) {
      return;
    }

    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
      )
    ) {
      setError('Choose a JPEG, PNG, or WebP image');
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const minZoom = minCoveredZoom(image.width, image.height, CROP_SIZE);
      setSourceUrl(url);
      setCrop(
        constrainCrop({
          offsetX: 0,
          offsetY: 0,
          zoom: minZoom,
          cropSize: CROP_SIZE,
          imageWidth: image.width,
          imageHeight: image.height,
        }),
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Could not load selected image');
    };
    image.src = url;
  }

  function closeCropper() {
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }
    setSourceUrl(null);
    setCrop(null);
    setDragStart(null);
    setUploadProgress(null);
  }

  async function confirmCrop() {
    if (!sourceUrl || !crop) {
      return;
    }

    setError('');
    setStatus('Uploading picture');
    setUploadProgress(0);

    try {
      const blob = await createCroppedImage(sourceUrl, crop);
      await uploadPictureMutation.mutateAsync({
        file: blob,
        onProgress: setUploadProgress,
      });
      setStatus('Profile picture saved');
      closeCropper();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Upload failed',
      );
      setStatus('');
    }
  }

  async function removePicture() {
    setError('');
    setStatus('Removing picture');

    try {
      await removePictureMutation.mutateAsync();
      setStatus('Profile picture removed');
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : 'Remove failed',
      );
      setStatus('');
    }
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!crop) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: crop.offsetX,
      offsetY: crop.offsetY,
    });
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!crop || !dragStart) {
      return;
    }

    setCrop(
      constrainCrop({
        ...crop,
        offsetX: dragStart.offsetX + event.clientX - dragStart.pointerX,
        offsetY: dragStart.offsetY + event.clientY - dragStart.pointerY,
      }),
    );
  }

  function updateZoom(value: number) {
    if (!crop) {
      return;
    }

    setCrop(constrainCrop({ ...crop, zoom: value }));
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <section
        className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_280px]"
        aria-label="Profile management"
      >
        <form className={PANEL_CLASS} onSubmit={onSubmit}>
          <header className="mb-4 flex items-center justify-between">
            <h1 className="m-0 text-[28px] font-semibold text-slate-900">
              Profile
            </h1>
            <button className={BUTTON_CLASS} type="submit">
              <Save size={18} aria-hidden="true" />
              Save
            </button>
          </header>

          <label className={FIELD_CLASS}>
            Full name
            <input
              className={INPUT_CLASS}
              value={form.fullName}
              onChange={(event) => updateForm('fullName', event.target.value)}
            />
          </label>
          <label className={FIELD_CLASS}>
            Headline
            <input
              className={INPUT_CLASS}
              value={form.headline}
              onChange={(event) => updateForm('headline', event.target.value)}
            />
          </label>
          <label className={FIELD_CLASS}>
            Biography
            <textarea
              className={`${INPUT_CLASS} min-h-30 resize-y`}
              value={form.biography}
              onChange={(event) => updateForm('biography', event.target.value)}
            />
          </label>
          <label className={FIELD_CLASS}>
            Location
            <input
              className={INPUT_CLASS}
              value={form.location}
              onChange={(event) => updateForm('location', event.target.value)}
            />
          </label>
          <label className={FIELD_CLASS}>
            Email
            <input
              className={INPUT_CLASS}
              value={form.email}
              onChange={(event) => updateForm('email', event.target.value)}
            />
          </label>
          <label className={FIELD_CLASS}>
            GitHub URL
            <input
              className={INPUT_CLASS}
              value={form.githubUrl ?? ''}
              onChange={(event) => updateForm('githubUrl', event.target.value)}
            />
          </label>
          <label className={FIELD_CLASS}>
            LinkedIn URL
            <input
              className={INPUT_CLASS}
              value={form.linkedinUrl ?? ''}
              onChange={(event) =>
                updateForm('linkedinUrl', event.target.value)
              }
            />
          </label>
        </form>

        <aside className={`${PANEL_CLASS} grid gap-3`}>
          <div
            className="flex aspect-square w-full items-center justify-center overflow-hidden border border-slate-300 bg-slate-200"
            aria-label="Current profile picture"
          >
            {profile?.profilePictureUrl ? (
              <img
                className="h-full w-full object-cover"
                src={profile.profilePictureUrl}
                alt=""
              />
            ) : (
              <span>No picture</span>
            )}
          </div>
          <label className={BUTTON_CLASS}>
            <Upload size={18} aria-hidden="true" />
            Select
            <input
              className="hidden"
              aria-label="Select profile picture"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={onFileSelected}
            />
          </label>
          <button
            className={BUTTON_CLASS}
            type="button"
            onClick={removePicture}
          >
            <Trash2 size={18} aria-hidden="true" />
            Remove
          </button>
          {status ? (
            <p className="text-teal-700" role="status">
              {status}
            </p>
          ) : null}
          {uploadProgress !== null ? (
            <progress
              className="w-full"
              value={uploadProgress}
              max={100}
              aria-label="Upload progress"
            />
          ) : null}
          {error ? (
            <p className="text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </aside>
      </section>

      {sourceUrl && crop ? (
        <section
          className="fixed inset-0 bg-slate-950/65 p-6"
          aria-label="Crop profile picture"
        >
          <div
            className={`${PANEL_CLASS} mx-auto mt-[5vh] grid max-w-[760px] gap-5 md:grid-cols-[320px_minmax(220px,1fr)]`}
          >
            <div
              className="aspect-square w-full cursor-grab touch-none border border-slate-500 bg-slate-900 bg-no-repeat md:w-80"
              style={cropStyle}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={() => setDragStart(null)}
            />
            <div className="grid gap-3">
              <label className={FIELD_CLASS}>
                Zoom
                <input
                  className={INPUT_CLASS}
                  aria-label="Zoom"
                  type="range"
                  min={minCoveredZoom(
                    crop.imageWidth,
                    crop.imageHeight,
                    crop.cropSize,
                  )}
                  max={Math.max(
                    4,
                    minCoveredZoom(
                      crop.imageWidth,
                      crop.imageHeight,
                      crop.cropSize,
                    ) * 4,
                  )}
                  step={0.01}
                  value={crop.zoom}
                  onChange={(event) => updateZoom(Number(event.target.value))}
                />
              </label>
              <div
                className="aspect-square w-32 border border-slate-500 bg-slate-900 bg-no-repeat"
                style={cropStyle}
                aria-label={`${OUTPUT_SIZE} by ${OUTPUT_SIZE} crop preview`}
              />
              <button
                className={BUTTON_CLASS}
                type="button"
                onClick={confirmCrop}
              >
                <Check size={18} aria-hidden="true" />
                Confirm
              </button>
              <button
                className={BUTTON_CLASS}
                type="button"
                onClick={closeCropper}
              >
                <X size={18} aria-hidden="true" />
                Cancel
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
