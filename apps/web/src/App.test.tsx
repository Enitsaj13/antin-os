import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { constrainCrop, CropState, OUTPUT_SIZE } from './crop';
import type { Profile } from '@antin-os/shared';
import * as profileQueries from './queries/profile.queries';
import * as profileMutations from './mutations/profile.mutations';

vi.mock('./queries/profile.queries');
vi.mock('./mutations/profile.mutations');

const mockedProfileQueries = vi.mocked(profileQueries);
const mockedProfileMutations = vi.mocked(profileMutations);

const uploadProfilePicture = vi.fn();
const saveProfile = vi.fn();
const removeProfilePicture = vi.fn();

class MockImage {
  width = 1000;
  height = 800;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_: string) {
    queueMicrotask(() => this.onload?.());
  }
}

Object.defineProperty(globalThis, 'Image', {
  value: MockImage,
});

Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:source'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn((contextId: string) =>
    contextId === '2d'
      ? ({
          drawImage: vi.fn(),
        } as unknown as CanvasRenderingContext2D)
      : null,
  ),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: vi.fn(function toBlob(callback: BlobCallback) {
    callback(new Blob(['cropped'], { type: 'image/webp' }));
  }),
});

function resetApiMocks() {
  mockedProfileQueries.useProfile.mockReset();
  mockedProfileMutations.useSaveProfileMutation.mockReset();
  mockedProfileMutations.useUploadProfilePictureMutation.mockReset();
  mockedProfileMutations.useRemoveProfilePictureMutation.mockReset();
  saveProfile.mockReset();
  uploadProfilePicture.mockReset();
  removeProfilePicture.mockReset();
}

afterEach(() => {
  cleanup();
  resetApiMocks();
});

function file(type = 'image/png') {
  return new File(['source'], 'source.png', { type });
}

function mockProfileHooks(profile: Profile | null = null) {
  mockedProfileQueries.useProfile.mockReturnValue({
    data: profile,
  } as ReturnType<typeof profileQueries.useProfile>);
  mockedProfileMutations.useSaveProfileMutation.mockReturnValue({
    mutateAsync: saveProfile,
  } as unknown as ReturnType<typeof profileMutations.useSaveProfileMutation>);
  mockedProfileMutations.useUploadProfilePictureMutation.mockReturnValue({
    mutateAsync: uploadProfilePicture,
  } as unknown as ReturnType<
    typeof profileMutations.useUploadProfilePictureMutation
  >);
  mockedProfileMutations.useRemoveProfilePictureMutation.mockReturnValue({
    mutateAsync: removeProfilePicture,
  } as unknown as ReturnType<
    typeof profileMutations.useRemoveProfilePictureMutation
  >);
}

describe('profile admin', () => {
  it('canceling crop performs no upload', async () => {
    mockProfileHooks();
    uploadProfilePicture.mockResolvedValue({} as Profile);

    render(<App />);

    fireEvent.change(screen.getByLabelText('Select profile picture'), {
      target: { files: [file()] },
    });

    await screen.findByLabelText('Crop profile picture');
    fireEvent.click(screen.getByText('Cancel'));

    expect(uploadProfilePicture).not.toHaveBeenCalled();
  });

  it('crop confirmation uploads a generated square output', async () => {
    const savedProfile: Profile = {
      id: 'profile-1',
      fullName: 'Antin',
      headline: 'Developer',
      biography: 'Bio',
      location: 'Manila',
      email: 'antin@example.com',
      githubUrl: null,
      linkedinUrl: null,
      profilePictureUrl: 'https://example.com/picture.webp',
      createdAt: '',
      updatedAt: '',
    };
    let resolveUpload: ((profile: Profile) => void) | undefined;

    mockProfileHooks();
    uploadProfilePicture.mockImplementation(({ onProgress }) => {
      onProgress(100);
      return new Promise((resolve) => {
        resolveUpload = resolve;
      });
    });

    render(<App />);

    fireEvent.change(screen.getByLabelText('Select profile picture'), {
      target: { files: [file()] },
    });

    await screen.findByLabelText('Crop profile picture');
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => expect(uploadProfilePicture).toHaveBeenCalled());
    const uploadedBlob = uploadProfilePicture.mock.calls[0]?.[0]?.file as
      Blob | undefined;
    expect(uploadedBlob).toBeInstanceOf(Blob);
    expect(uploadedBlob?.type).toBe('image/webp');
    await waitFor(() =>
      expect(screen.getByLabelText('Upload progress')).toHaveValue(100),
    );

    resolveUpload?.(savedProfile);
    expect(
      await screen.findByText('Profile picture saved'),
    ).toBeInTheDocument();
  });

  it('constrains repositioning and zoom to keep the crop covered', () => {
    const state: CropState = {
      offsetX: 1000,
      offsetY: -1000,
      zoom: 0.1,
      cropSize: 320,
      imageWidth: 1000,
      imageHeight: 800,
    };

    const constrained = constrainCrop(state);

    expect(constrained.zoom).toBeGreaterThanOrEqual(0.4);
    expect(Math.abs(constrained.offsetX)).toBeLessThanOrEqual(40);
    expect(Math.abs(constrained.offsetY)).toBeLessThanOrEqual(0);
  });

  it('uses a 512 by 512 crop output size', () => {
    expect(OUTPUT_SIZE).toBe(512);
  });

  it('shows upload and storage errors', async () => {
    mockProfileHooks();
    uploadProfilePicture.mockRejectedValue(new Error('storage failed'));

    render(<App />);

    fireEvent.change(screen.getByLabelText('Select profile picture'), {
      target: { files: [file()] },
    });

    await screen.findByLabelText('Crop profile picture');
    fireEvent.click(screen.getByText('Confirm'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'storage failed',
    );
  });
});
