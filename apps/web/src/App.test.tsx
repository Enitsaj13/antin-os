import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { validateExperienceForm } from './ExperienceAdmin';
import { constrainCrop, CropState, OUTPUT_SIZE } from './crop';
import type {
  Certification,
  Education,
  Experience,
  PortfolioSettings,
  Profile,
  Project,
  ProjectCaseStudy,
  PublicResume,
  Resume,
} from '@antin-os/shared';
import * as profileQueries from './queries/profile.queries';
import * as profileMutations from './mutations/profile.mutations';
import * as projectQueries from './queries/project.queries';
import * as projectMutations from './mutations/project.mutations';
import * as credentialsQueries from './queries/credentials.queries';
import * as credentialsMutations from './mutations/credentials.mutations';
import * as experienceQueries from './queries/experience.queries';
import * as experienceMutations from './mutations/experience.mutations';
import * as resumeQueries from './queries/resume.queries';
import * as resumeMutations from './mutations/resume.mutations';
import * as authQueries from './queries/auth.queries';
import * as authMutations from './mutations/auth.mutations';

vi.mock('./queries/profile.queries');
vi.mock('./mutations/profile.mutations');
vi.mock('./queries/project.queries');
vi.mock('./mutations/project.mutations');
vi.mock('./queries/credentials.queries');
vi.mock('./mutations/credentials.mutations');
vi.mock('./queries/experience.queries');
vi.mock('./mutations/experience.mutations');
vi.mock('./queries/resume.queries');
vi.mock('./mutations/resume.mutations');
vi.mock('./queries/auth.queries');
vi.mock('./mutations/auth.mutations');

const mockedProfileQueries = vi.mocked(profileQueries);
const mockedProfileMutations = vi.mocked(profileMutations);
const mockedProjectQueries = vi.mocked(projectQueries);
const mockedProjectMutations = vi.mocked(projectMutations);
const mockedCredentialsQueries = vi.mocked(credentialsQueries);
const mockedCredentialsMutations = vi.mocked(credentialsMutations);
const mockedExperienceQueries = vi.mocked(experienceQueries);
const mockedExperienceMutations = vi.mocked(experienceMutations);
const mockedResumeQueries = vi.mocked(resumeQueries);
const mockedResumeMutations = vi.mocked(resumeMutations);
const mockedAuthQueries = vi.mocked(authQueries);
const mockedAuthMutations = vi.mocked(authMutations);

const uploadProfilePicture = vi.fn();
const saveProfile = vi.fn();
const removeProfilePicture = vi.fn();
const createProject = vi.fn();
const updateProject = vi.fn();
const deleteProject = vi.fn();
const uploadProjectImage = vi.fn();
const generateProjectCaseStudyDraft = vi.fn();
const createProjectCaseStudy = vi.fn();
const updateProjectCaseStudy = vi.fn();
const updateProjectCaseStudyPublication = vi.fn();
const deleteProjectCaseStudy = vi.fn();
const updatePortfolioSettings = vi.fn();
const createEducation = vi.fn();
const updateEducation = vi.fn();
const deleteEducation = vi.fn();
const reorderEducations = vi.fn();
const createCertification = vi.fn();
const updateCertification = vi.fn();
const deleteCertification = vi.fn();
const reorderCertifications = vi.fn();
const createExperience = vi.fn();
const updateExperience = vi.fn();
const deleteExperience = vi.fn();
const reorderExperiences = vi.fn();
const uploadResume = vi.fn();
const updateResumePublication = vi.fn();
const deleteResume = vi.fn();
const loginAdmin = vi.fn();
const logoutAdmin = vi.fn();
const refetchPublicProfile = vi.fn();
const refetchProjects = vi.fn();
const refetchProject = vi.fn();
const refetchProjectCaseStudy = vi.fn();
const refetchPublicProjects = vi.fn();
const refetchPublicProject = vi.fn();
const refetchPortfolioSettings = vi.fn();
const refetchEducations = vi.fn();
const refetchEducation = vi.fn();
const refetchPublicEducations = vi.fn();
const refetchCertifications = vi.fn();
const refetchCertification = vi.fn();
const refetchPublicCertifications = vi.fn();
const refetchExperiences = vi.fn();
const refetchExperience = vi.fn();
const refetchPublicExperiences = vi.fn();
const refetchResume = vi.fn();
const refetchPublicResume = vi.fn();

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
  mockedProfileQueries.usePublicProfile.mockReset();
  mockedProfileMutations.useSaveProfileMutation.mockReset();
  mockedProfileMutations.useUploadProfilePictureMutation.mockReset();
  mockedProfileMutations.useRemoveProfilePictureMutation.mockReset();
  mockedProjectQueries.useProjects.mockReset();
  mockedProjectQueries.useProject.mockReset();
  mockedProjectQueries.useProjectCaseStudy.mockReset();
  mockedProjectQueries.usePublicProjects.mockReset();
  mockedProjectQueries.usePublicProject.mockReset();
  mockedProjectMutations.useCreateProjectMutation.mockReset();
  mockedProjectMutations.useUpdateProjectMutation.mockReset();
  mockedProjectMutations.useDeleteProjectMutation.mockReset();
  mockedProjectMutations.useUploadProjectImageMutation.mockReset();
  mockedProjectMutations.useGenerateProjectCaseStudyDraftMutation.mockReset();
  mockedProjectMutations.useCreateProjectCaseStudyMutation.mockReset();
  mockedProjectMutations.useUpdateProjectCaseStudyMutation.mockReset();
  mockedProjectMutations.useUpdateProjectCaseStudyPublicationMutation.mockReset();
  mockedProjectMutations.useDeleteProjectCaseStudyMutation.mockReset();
  mockedCredentialsQueries.usePortfolioSettings.mockReset();
  mockedCredentialsQueries.useEducations.mockReset();
  mockedCredentialsQueries.useEducation.mockReset();
  mockedCredentialsQueries.usePublicEducations.mockReset();
  mockedCredentialsQueries.useCertifications.mockReset();
  mockedCredentialsQueries.useCertification.mockReset();
  mockedCredentialsQueries.usePublicCertifications.mockReset();
  mockedCredentialsMutations.useUpdatePortfolioSettingsMutation.mockReset();
  mockedCredentialsMutations.useCreateEducationMutation.mockReset();
  mockedCredentialsMutations.useUpdateEducationMutation.mockReset();
  mockedCredentialsMutations.useDeleteEducationMutation.mockReset();
  mockedCredentialsMutations.useReorderEducationsMutation.mockReset();
  mockedCredentialsMutations.useCreateCertificationMutation.mockReset();
  mockedCredentialsMutations.useUpdateCertificationMutation.mockReset();
  mockedCredentialsMutations.useDeleteCertificationMutation.mockReset();
  mockedCredentialsMutations.useReorderCertificationsMutation.mockReset();
  mockedExperienceQueries.useExperiences.mockReset();
  mockedExperienceQueries.useExperience.mockReset();
  mockedExperienceQueries.usePublicExperiences.mockReset();
  mockedExperienceMutations.useCreateExperienceMutation.mockReset();
  mockedExperienceMutations.useUpdateExperienceMutation.mockReset();
  mockedExperienceMutations.useDeleteExperienceMutation.mockReset();
  mockedExperienceMutations.useReorderExperiencesMutation.mockReset();
  mockedResumeQueries.useResume.mockReset();
  mockedResumeQueries.usePublicResume.mockReset();
  mockedResumeMutations.useUploadResumeMutation.mockReset();
  mockedResumeMutations.useUpdateResumePublicationMutation.mockReset();
  mockedResumeMutations.useDeleteResumeMutation.mockReset();
  mockedAuthQueries.useAdminSession.mockReset();
  mockedAuthMutations.useLoginAdminMutation.mockReset();
  mockedAuthMutations.useLogoutAdminMutation.mockReset();
  saveProfile.mockReset();
  uploadProfilePicture.mockReset();
  removeProfilePicture.mockReset();
  createProject.mockReset();
  updateProject.mockReset();
  deleteProject.mockReset();
  uploadProjectImage.mockReset();
  generateProjectCaseStudyDraft.mockReset();
  createProjectCaseStudy.mockReset();
  updateProjectCaseStudy.mockReset();
  updateProjectCaseStudyPublication.mockReset();
  deleteProjectCaseStudy.mockReset();
  updatePortfolioSettings.mockReset();
  createEducation.mockReset();
  updateEducation.mockReset();
  deleteEducation.mockReset();
  reorderEducations.mockReset();
  createCertification.mockReset();
  updateCertification.mockReset();
  deleteCertification.mockReset();
  reorderCertifications.mockReset();
  createExperience.mockReset();
  updateExperience.mockReset();
  deleteExperience.mockReset();
  reorderExperiences.mockReset();
  uploadResume.mockReset();
  updateResumePublication.mockReset();
  deleteResume.mockReset();
  loginAdmin.mockReset();
  logoutAdmin.mockReset();
  refetchPublicProfile.mockReset();
  refetchProjects.mockReset();
  refetchProject.mockReset();
  refetchProjectCaseStudy.mockReset();
  refetchPublicProjects.mockReset();
  refetchPublicProject.mockReset();
  refetchPortfolioSettings.mockReset();
  refetchEducations.mockReset();
  refetchEducation.mockReset();
  refetchPublicEducations.mockReset();
  refetchCertifications.mockReset();
  refetchCertification.mockReset();
  refetchPublicCertifications.mockReset();
  refetchExperiences.mockReset();
  refetchExperience.mockReset();
  refetchPublicExperiences.mockReset();
  refetchResume.mockReset();
  refetchPublicResume.mockReset();
}

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

function mockAuthHooks(authenticated = true) {
  mockedAuthQueries.useAdminSession.mockReturnValue({
    data: authenticated
      ? { authenticated: true, user: { username: 'owner' } }
      : { authenticated: false, user: null },
    isLoading: false,
  } as ReturnType<typeof authQueries.useAdminSession>);
  mockedAuthMutations.useLoginAdminMutation.mockReturnValue({
    mutateAsync: loginAdmin,
    isPending: false,
  } as unknown as ReturnType<typeof authMutations.useLoginAdminMutation>);
  mockedAuthMutations.useLogoutAdminMutation.mockReturnValue({
    mutateAsync: logoutAdmin,
    isPending: false,
  } as unknown as ReturnType<typeof authMutations.useLogoutAdminMutation>);
}

function publicProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'profile-1',
    fullName: 'Jastine Formentera',
    headline: 'Full-stack developer',
    biography: 'I build useful web and mobile products.',
    location: 'Manila, Philippines',
    email: 'jastine@example.com',
    githubUrl: 'https://github.com/Enitsaj13',
    linkedinUrl: 'https://linkedin.com/in/jastine',
    profilePictureUrl: 'https://example.com/profile.webp',
    createdAt: '2026-08-13T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
    ...overrides,
  };
}

function mockPublicProfileHook(profile: Profile | null = publicProfile()) {
  mockedProfileQueries.usePublicProfile.mockReturnValue({
    data: profile,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchPublicProfile,
  } as unknown as ReturnType<typeof profileQueries.usePublicProfile>);
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    title: 'Portfolio API',
    slug: 'portfolio-api',
    summary: 'A portfolio API',
    description: 'Detailed description',
    techStack: ['NestJS', 'Prisma'],
    repoUrl: 'https://github.com/example/repo',
    liveUrl: 'https://example.com',
    imageUrl: 'https://example.com/image.png',
    imageKey: null,
    isPublic: true,
    createdAt: '2026-08-13T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
    ...overrides,
  };
}

function caseStudy(
  overrides: Partial<ProjectCaseStudy> = {},
): ProjectCaseStudy {
  return {
    id: 'case-study-1',
    projectId: 'project-1',
    context: 'The portfolio needed deeper project proof.',
    problem: 'Recruiters need to understand the technical tradeoffs.',
    role: 'Full-stack developer',
    approach: 'Built a dedicated case-study workflow.',
    responsibilities: ['Designed the data model', 'Built the admin editor'],
    technicalChallenges: ['Keeping drafts private'],
    outcomes: ['Published a scannable case study'],
    lessonsLearned: 'Structured content is easier to review.',
    isPublic: true,
    createdAt: '2026-08-13T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
    ...overrides,
  };
}

function experience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 'experience-1',
    company: 'StepCast',
    role: 'Lead Mobile Developer',
    location: 'Remote',
    employmentType: 'Contract',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: null,
    isCurrent: true,
    summary: 'Built the Expo consumer guide app.',
    achievements: ['Built guided playback', 'Shipped TestFlight builds'],
    technologies: ['Expo', 'React Native', 'TypeScript'],
    displayOrder: 0,
    isPublic: true,
    createdAt: '2026-08-13T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
    ...overrides,
  };
}

function portfolioSettings(
  overrides: Partial<PortfolioSettings> = {},
): PortfolioSettings {
  return {
    id: 'settings-1',
    singletonKey: 'owner',
    showEducation: false,
    showCertifications: false,
    createdAt: '2026-08-25T10:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
    ...overrides,
  };
}

function education(overrides: Partial<Education> = {}): Education {
  return {
    id: 'education-1',
    institution: 'University of Cebu',
    credential: 'BS Information Technology',
    fieldOfStudy: 'Software Development',
    location: 'Cebu, Philippines',
    startDate: '2018-06-01T00:00:00.000Z',
    endDate: '2022-04-01T00:00:00.000Z',
    summary: 'Studied software engineering foundations.',
    displayOrder: 0,
    isPublic: true,
    createdAt: '2026-08-13T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
    ...overrides,
  };
}

function certification(overrides: Partial<Certification> = {}): Certification {
  return {
    id: 'certification-1',
    name: 'AWS Cloud Practitioner',
    issuer: 'Amazon Web Services',
    issueDate: '2026-01-01T00:00:00.000Z',
    expirationDate: '2029-01-01T00:00:00.000Z',
    credentialId: 'AWS-123',
    credentialUrl: 'https://example.com/aws',
    summary: 'Cloud fundamentals certification.',
    displayOrder: 0,
    isPublic: true,
    createdAt: '2026-08-13T10:00:00.000Z',
    updatedAt: '2026-08-14T10:00:00.000Z',
    ...overrides,
  };
}

function resume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: 'resume-1',
    originalFilename: 'Jastine-CV.pdf',
    fileSize: 120_000,
    contentType: 'application/pdf',
    isPublic: false,
    uploadedAt: '2026-08-25T10:00:00.000Z',
    createdAt: '2026-08-25T10:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
    ...overrides,
  };
}

function publicResume(overrides: Partial<PublicResume> = {}): PublicResume {
  return {
    id: 'resume-1',
    originalFilename: 'Jastine-CV.pdf',
    fileSize: 120_000,
    contentType: 'application/pdf',
    isPublic: true,
    uploadedAt: '2026-08-25T10:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
    downloadUrl: 'http://localhost:3001/public/resume/download',
    ...overrides,
  };
}

function mockProjectHooks(
  projects: Project[] = [],
  caseStudies: Record<string, ProjectCaseStudy | null> = {},
) {
  mockedProjectQueries.useProjects.mockReturnValue({
    data: projects,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchProjects,
  } as unknown as ReturnType<typeof projectQueries.useProjects>);
  mockedProjectQueries.useProject.mockImplementation((idOrSlug: string) => {
    const found = projects.find(
      (candidate) => candidate.id === idOrSlug || candidate.slug === idOrSlug,
    );

    return {
      data: found ?? null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchProject,
    } as unknown as ReturnType<typeof projectQueries.useProject>;
  });
  mockedProjectQueries.useProjectCaseStudy.mockImplementation((id: string) => {
    const value = Object.prototype.hasOwnProperty.call(caseStudies, id)
      ? caseStudies[id]
      : null;

    return {
      data: value,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchProjectCaseStudy,
    } as unknown as ReturnType<typeof projectQueries.useProjectCaseStudy>;
  });
  mockedProjectMutations.useCreateProjectMutation.mockReturnValue({
    mutateAsync: createProject,
    isPending: false,
  } as unknown as ReturnType<typeof projectMutations.useCreateProjectMutation>);
  mockedProjectMutations.useUpdateProjectMutation.mockReturnValue({
    mutateAsync: updateProject,
    isPending: false,
  } as unknown as ReturnType<typeof projectMutations.useUpdateProjectMutation>);
  mockedProjectMutations.useDeleteProjectMutation.mockReturnValue({
    mutateAsync: deleteProject,
    isPending: false,
  } as unknown as ReturnType<typeof projectMutations.useDeleteProjectMutation>);
  mockedProjectMutations.useUploadProjectImageMutation.mockReturnValue({
    mutateAsync: uploadProjectImage,
    isPending: false,
  } as unknown as ReturnType<
    typeof projectMutations.useUploadProjectImageMutation
  >);
  mockedProjectMutations.useGenerateProjectCaseStudyDraftMutation.mockReturnValue(
    {
      mutateAsync: generateProjectCaseStudyDraft,
      isPending: false,
    } as unknown as ReturnType<
      typeof projectMutations.useGenerateProjectCaseStudyDraftMutation
    >,
  );
  mockedProjectMutations.useCreateProjectCaseStudyMutation.mockReturnValue({
    mutateAsync: createProjectCaseStudy,
    isPending: false,
  } as unknown as ReturnType<
    typeof projectMutations.useCreateProjectCaseStudyMutation
  >);
  mockedProjectMutations.useUpdateProjectCaseStudyMutation.mockReturnValue({
    mutateAsync: updateProjectCaseStudy,
    isPending: false,
  } as unknown as ReturnType<
    typeof projectMutations.useUpdateProjectCaseStudyMutation
  >);
  mockedProjectMutations.useUpdateProjectCaseStudyPublicationMutation.mockReturnValue(
    {
      mutateAsync: updateProjectCaseStudyPublication,
      isPending: false,
    } as unknown as ReturnType<
      typeof projectMutations.useUpdateProjectCaseStudyPublicationMutation
    >,
  );
  mockedProjectMutations.useDeleteProjectCaseStudyMutation.mockReturnValue({
    mutateAsync: deleteProjectCaseStudy,
    isPending: false,
  } as unknown as ReturnType<
    typeof projectMutations.useDeleteProjectCaseStudyMutation
  >);
}

function mockExperienceHooks(experiences: Experience[] = []) {
  mockedExperienceQueries.useExperiences.mockReturnValue({
    data: experiences,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchExperiences,
  } as unknown as ReturnType<typeof experienceQueries.useExperiences>);
  mockedExperienceQueries.useExperience.mockImplementation((id: string) => {
    const found = experiences.find((candidate) => candidate.id === id);

    return {
      data: found ?? null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchExperience,
    } as unknown as ReturnType<typeof experienceQueries.useExperience>;
  });
  mockedExperienceMutations.useCreateExperienceMutation.mockReturnValue({
    mutateAsync: createExperience,
    isPending: false,
  } as unknown as ReturnType<
    typeof experienceMutations.useCreateExperienceMutation
  >);
  mockedExperienceMutations.useUpdateExperienceMutation.mockReturnValue({
    mutateAsync: updateExperience,
    isPending: false,
  } as unknown as ReturnType<
    typeof experienceMutations.useUpdateExperienceMutation
  >);
  mockedExperienceMutations.useDeleteExperienceMutation.mockReturnValue({
    mutateAsync: deleteExperience,
    isPending: false,
  } as unknown as ReturnType<
    typeof experienceMutations.useDeleteExperienceMutation
  >);
  mockedExperienceMutations.useReorderExperiencesMutation.mockReturnValue({
    mutateAsync: reorderExperiences,
    isPending: false,
  } as unknown as ReturnType<
    typeof experienceMutations.useReorderExperiencesMutation
  >);
}

function mockCredentialsHooks({
  settings = portfolioSettings(),
  educations = [],
  certifications = [],
}: {
  settings?: PortfolioSettings;
  educations?: Education[];
  certifications?: Certification[];
} = {}) {
  mockedCredentialsQueries.usePortfolioSettings.mockReturnValue({
    data: settings,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchPortfolioSettings,
  } as unknown as ReturnType<typeof credentialsQueries.usePortfolioSettings>);
  mockedCredentialsQueries.useEducations.mockReturnValue({
    data: educations,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchEducations,
  } as unknown as ReturnType<typeof credentialsQueries.useEducations>);
  mockedCredentialsQueries.useEducation.mockImplementation((id: string) => {
    const found = educations.find((candidate) => candidate.id === id);

    return {
      data: found ?? null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchEducation,
    } as unknown as ReturnType<typeof credentialsQueries.useEducation>;
  });
  mockedCredentialsQueries.useCertifications.mockReturnValue({
    data: certifications,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchCertifications,
  } as unknown as ReturnType<typeof credentialsQueries.useCertifications>);
  mockedCredentialsQueries.useCertification.mockImplementation((id: string) => {
    const found = certifications.find((candidate) => candidate.id === id);

    return {
      data: found ?? null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchCertification,
    } as unknown as ReturnType<typeof credentialsQueries.useCertification>;
  });
  mockedCredentialsMutations.useUpdatePortfolioSettingsMutation.mockReturnValue(
    {
      mutateAsync: updatePortfolioSettings,
      isPending: false,
    } as unknown as ReturnType<
      typeof credentialsMutations.useUpdatePortfolioSettingsMutation
    >,
  );
  mockedCredentialsMutations.useCreateEducationMutation.mockReturnValue({
    mutateAsync: createEducation,
    isPending: false,
  } as unknown as ReturnType<
    typeof credentialsMutations.useCreateEducationMutation
  >);
  mockedCredentialsMutations.useUpdateEducationMutation.mockReturnValue({
    mutateAsync: updateEducation,
    isPending: false,
  } as unknown as ReturnType<
    typeof credentialsMutations.useUpdateEducationMutation
  >);
  mockedCredentialsMutations.useDeleteEducationMutation.mockReturnValue({
    mutateAsync: deleteEducation,
    isPending: false,
  } as unknown as ReturnType<
    typeof credentialsMutations.useDeleteEducationMutation
  >);
  mockedCredentialsMutations.useReorderEducationsMutation.mockReturnValue({
    mutateAsync: reorderEducations,
    isPending: false,
  } as unknown as ReturnType<
    typeof credentialsMutations.useReorderEducationsMutation
  >);
  mockedCredentialsMutations.useCreateCertificationMutation.mockReturnValue({
    mutateAsync: createCertification,
    isPending: false,
  } as unknown as ReturnType<
    typeof credentialsMutations.useCreateCertificationMutation
  >);
  mockedCredentialsMutations.useUpdateCertificationMutation.mockReturnValue({
    mutateAsync: updateCertification,
    isPending: false,
  } as unknown as ReturnType<
    typeof credentialsMutations.useUpdateCertificationMutation
  >);
  mockedCredentialsMutations.useDeleteCertificationMutation.mockReturnValue({
    mutateAsync: deleteCertification,
    isPending: false,
  } as unknown as ReturnType<
    typeof credentialsMutations.useDeleteCertificationMutation
  >);
  mockedCredentialsMutations.useReorderCertificationsMutation.mockReturnValue({
    mutateAsync: reorderCertifications,
    isPending: false,
  } as unknown as ReturnType<
    typeof credentialsMutations.useReorderCertificationsMutation
  >);
}

function mockResumeHooks(currentResume: Resume | null = null) {
  mockedResumeQueries.useResume.mockReturnValue({
    data: currentResume,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchResume,
  } as unknown as ReturnType<typeof resumeQueries.useResume>);
  mockedResumeMutations.useUploadResumeMutation.mockReturnValue({
    mutateAsync: uploadResume,
    isPending: false,
  } as unknown as ReturnType<typeof resumeMutations.useUploadResumeMutation>);
  mockedResumeMutations.useUpdateResumePublicationMutation.mockReturnValue({
    mutateAsync: updateResumePublication,
    isPending: false,
  } as unknown as ReturnType<
    typeof resumeMutations.useUpdateResumePublicationMutation
  >);
  mockedResumeMutations.useDeleteResumeMutation.mockReturnValue({
    mutateAsync: deleteResume,
    isPending: false,
  } as unknown as ReturnType<typeof resumeMutations.useDeleteResumeMutation>);
}

function mockPublicProjectHooks(projects: Project[] = []) {
  mockedProjectQueries.usePublicProjects.mockReturnValue({
    data: projects,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchPublicProjects,
  } as unknown as ReturnType<typeof projectQueries.usePublicProjects>);
  mockedProjectQueries.usePublicProject.mockImplementation((slug: string) => {
    const found = projects.find((candidate) => candidate.slug === slug);

    return {
      data: found ?? null,
      isLoading: false,
      isError: false,
      error: found ? null : new Error('Request failed with status 404'),
      refetch: refetchPublicProject,
    } as unknown as ReturnType<typeof projectQueries.usePublicProject>;
  });
}

function mockPublicExperienceHooks(experiences: Experience[] = []) {
  mockedExperienceQueries.usePublicExperiences.mockReturnValue({
    data: experiences,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchPublicExperiences,
  } as unknown as ReturnType<typeof experienceQueries.usePublicExperiences>);
}

function mockPublicCredentialHooks({
  educations = [],
  certifications = [],
}: {
  educations?: Education[];
  certifications?: Certification[];
} = {}) {
  mockedCredentialsQueries.usePublicEducations.mockReturnValue({
    data: educations,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchPublicEducations,
  } as unknown as ReturnType<typeof credentialsQueries.usePublicEducations>);
  mockedCredentialsQueries.usePublicCertifications.mockReturnValue({
    data: certifications,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchPublicCertifications,
  } as unknown as ReturnType<
    typeof credentialsQueries.usePublicCertifications
  >);
}

function mockPublicResumeHook(currentResume: PublicResume | null = null) {
  mockedResumeQueries.usePublicResume.mockReturnValue({
    data: currentResume,
    isLoading: false,
    isError: false,
    error: null,
    refetch: refetchPublicResume,
  } as unknown as ReturnType<typeof resumeQueries.usePublicResume>);
}

function renderApp(path = '/') {
  window.history.pushState({}, '', path);

  return render(<App />);
}

beforeEach(() => {
  mockAuthHooks(true);
  mockProfileHooks();
  mockProjectHooks();
  mockCredentialsHooks();
  mockExperienceHooks();
  mockResumeHooks();
  mockPublicProfileHook();
  mockPublicProjectHooks();
  mockPublicCredentialHooks();
  mockPublicExperienceHooks();
  mockPublicResumeHook();
});

afterEach(() => {
  cleanup();
  resetApiMocks();
  window.history.pushState({}, '', '/');
  document.title = 'AntinOS Portfolio';
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', '');
});

describe('profile admin', () => {
  it('canceling crop performs no upload', async () => {
    mockProfileHooks();
    mockProjectHooks();
    uploadProfilePicture.mockResolvedValue({} as Profile);

    renderApp('/admin/profile');

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
    mockProjectHooks();
    uploadProfilePicture.mockImplementation(({ onProgress }) => {
      onProgress(100);
      return new Promise((resolve) => {
        resolveUpload = resolve;
      });
    });

    renderApp('/admin/profile');

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
    mockProjectHooks();
    uploadProfilePicture.mockRejectedValue(new Error('storage failed'));

    renderApp('/admin/profile');

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

describe('admin navigation', () => {
  it('routes profile management to /admin/profile and navigates to portfolio sections', () => {
    renderApp('/admin/profile');

    expect(
      screen.getByRole('heading', { name: 'Portfolio management' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Profile' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Projects' }));

    expect(window.location.pathname).toBe('/admin/projects');
    expect(
      screen.getByRole('heading', { name: 'Projects' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Experience' }));

    expect(window.location.pathname).toBe('/admin/experience');
    expect(
      screen.getByRole('heading', { name: 'Experience' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

    expect(window.location.pathname).toBe('/admin/resume');
    expect(screen.getByRole('heading', { name: 'Resume' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Credentials' }));

    expect(window.location.pathname).toBe('/admin/credentials');
    expect(
      screen.getByRole('heading', { name: 'Public section visibility' }),
    ).toBeInTheDocument();
  });

  it.each([
    '/admin/profile',
    '/admin/projects',
    '/admin/experience',
    '/admin/credentials',
    '/admin/resume',
    '/admin/projects/new',
    '/admin/projects/project-1/edit',
  ])(
    'redirects unauthenticated admin visitors from %s to login with the requested page',
    async (protectedPath) => {
      mockAuthHooks(false);

      renderApp(protectedPath);

      await waitFor(() =>
        expect(window.location.pathname).toBe('/admin/login'),
      );
      expect(window.location.search).toBe(
        `?returnTo=${encodeURIComponent(protectedPath)}`,
      );
    },
  );

  it('returns the owner to the requested admin page after login', async () => {
    mockAuthHooks(false);
    loginAdmin.mockImplementation(async () => {
      mockAuthHooks(true);

      return {
        authenticated: true,
        user: { username: 'owner' },
      };
    });

    renderApp('/admin/login?returnTo=/admin/projects');

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'owner' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(loginAdmin).toHaveBeenCalledWith({
        username: 'owner',
        password: 'correct-password',
      }),
    );
    await waitFor(() =>
      expect(window.location.pathname).toBe('/admin/projects'),
    );
  });

  it('shows safe login errors without exposing credential details', async () => {
    mockAuthHooks(false);
    loginAdmin.mockRejectedValue(
      new Error('{"message":"Invalid credentials","statusCode":401}'),
    );

    renderApp('/admin/login');

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'owner' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid username or password.',
    );

    loginAdmin.mockRejectedValue(
      new Error('{"message":"Too many login attempts","statusCode":429}'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many login attempts. Try again later.',
    );
  });

  it('signs out and returns to the login page', async () => {
    mockAuthHooks(true);
    logoutAdmin.mockResolvedValue({ authenticated: false, user: null });

    renderApp('/admin/profile');

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(logoutAdmin).toHaveBeenCalled());
    expect(window.location.pathname).toBe('/admin/login');
  });
});

describe('public homepage', () => {
  it('renders the public homepage at / without admin authentication or admin form content', () => {
    mockAuthHooks(false);
    mockPublicProfileHook();
    mockPublicProjectHooks([project()]);
    mockedProfileQueries.useProfile.mockImplementation(() => {
      throw new Error('Managed profile query should not run on public pages');
    });
    mockedProjectQueries.useProjects.mockImplementation(() => {
      throw new Error('Managed projects query should not run on public pages');
    });
    mockedProjectQueries.useProject.mockImplementation(() => {
      throw new Error('Managed project query should not run on public pages');
    });
    mockedExperienceQueries.useExperiences.mockImplementation(() => {
      throw new Error(
        'Managed experience query should not run on public pages',
      );
    });
    mockedExperienceQueries.useExperience.mockImplementation(() => {
      throw new Error(
        'Managed experience detail should not run on public pages',
      );
    });
    mockedCredentialsQueries.usePortfolioSettings.mockImplementation(() => {
      throw new Error('Managed settings query should not run on public pages');
    });
    mockedCredentialsQueries.useEducations.mockImplementation(() => {
      throw new Error('Managed education query should not run on public pages');
    });
    mockedCredentialsQueries.useCertifications.mockImplementation(() => {
      throw new Error(
        'Managed certification query should not run on public pages',
      );
    });
    mockedResumeQueries.useResume.mockImplementation(() => {
      throw new Error('Managed resume query should not run on public pages');
    });

    renderApp('/');

    expect(mockedAuthQueries.useAdminSession).toHaveBeenCalledWith(false);
    expect(mockedProfileQueries.usePublicProfile).toHaveBeenCalled();
    expect(mockedProjectQueries.usePublicProjects).toHaveBeenCalled();
    expect(mockedExperienceQueries.usePublicExperiences).toHaveBeenCalled();
    expect(mockedCredentialsQueries.usePublicEducations).toHaveBeenCalled();
    expect(mockedCredentialsQueries.usePublicCertifications).toHaveBeenCalled();
    expect(mockedResumeQueries.usePublicResume).toHaveBeenCalled();
    expect(mockedProfileQueries.useProfile).not.toHaveBeenCalled();
    expect(mockedProjectQueries.useProjects).not.toHaveBeenCalled();
    expect(mockedProjectQueries.useProject).not.toHaveBeenCalled();
    expect(mockedExperienceQueries.useExperiences).not.toHaveBeenCalled();
    expect(mockedExperienceQueries.useExperience).not.toHaveBeenCalled();
    expect(
      mockedCredentialsQueries.usePortfolioSettings,
    ).not.toHaveBeenCalled();
    expect(mockedCredentialsQueries.useEducations).not.toHaveBeenCalled();
    expect(mockedCredentialsQueries.useCertifications).not.toHaveBeenCalled();
    expect(mockedResumeQueries.useResume).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: 'Jastine Formentera' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Portfolio management' }),
    ).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('shows profile content, contact links, derived skills, selected projects, and navigation', () => {
    const featuredProject = project({
      techStack: ['NestJS', 'Prisma', 'React'],
    });
    const mobileProject = project({
      id: 'project-2',
      title: 'Mobile Guide',
      slug: 'mobile-guide',
      summary: 'Expo guide app',
      techStack: ['React', 'Expo'],
      imageUrl: null,
    });
    const extraProject = project({
      id: 'project-3',
      title: 'AWS Uploads',
      slug: 'aws-uploads',
      summary: 'S3 image upload flow',
      techStack: ['AWS', 'NestJS'],
    });
    const hiddenFromHighlights = project({
      id: 'project-4',
      title: 'Fourth Project',
      slug: 'fourth-project',
      summary: 'Not highlighted',
      techStack: ['TypeScript'],
    });
    mockPublicProfileHook();
    mockPublicExperienceHooks([experience()]);
    mockPublicCredentialHooks({
      educations: [education()],
      certifications: [certification()],
    });
    mockPublicResumeHook(publicResume());
    mockPublicProjectHooks([
      featuredProject,
      mobileProject,
      extraProject,
      hiddenFromHighlights,
    ]);

    renderApp('/');

    expect(
      screen.getByAltText('Jastine Formentera profile picture'),
    ).toHaveAttribute('src', 'https://example.com/profile.webp');
    expect(screen.getByText('Full-stack developer')).toBeInTheDocument();
    expect(
      screen.getByText('I build useful web and mobile products.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Manila, Philippines')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'jastine@example.com' }),
    ).toHaveAttribute('href', 'mailto:jastine@example.com');
    expect(
      screen.getByRole('link', {
        name: 'Open Jastine Formentera GitHub profile',
      }),
    ).toHaveAttribute('href', 'https://github.com/Enitsaj13');
    expect(
      screen.getByRole('link', {
        name: 'Open Jastine Formentera LinkedIn profile',
      }),
    ).toHaveAttribute('href', 'https://linkedin.com/in/jastine');
    expect(
      screen.getByRole('link', { name: 'Download Jastine Formentera CV' }),
    ).toHaveAttribute('href', 'http://localhost:3001/public/resume/download');

    const skills = screen
      .getByRole('heading', { name: 'Skills' })
      .closest('aside');
    expect(skills).not.toBeNull();
    expect(within(skills as HTMLElement).getByText('AWS')).toBeInTheDocument();
    expect(within(skills as HTMLElement).getByText('Expo')).toBeInTheDocument();
    expect(
      within(skills as HTMLElement).getByText('NestJS'),
    ).toBeInTheDocument();
    expect(
      within(skills as HTMLElement).getByText('Prisma'),
    ).toBeInTheDocument();
    expect(
      within(skills as HTMLElement).getByText('React'),
    ).toBeInTheDocument();

    expect(screen.getByText('Lead Mobile Developer')).toBeInTheDocument();
    expect(screen.getByText('StepCast')).toBeInTheDocument();
    expect(
      screen.getByText('Built the Expo consumer guide app.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Built guided playback')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Education' }),
    ).toBeInTheDocument();
    expect(screen.getByText('BS Information Technology')).toBeInTheDocument();
    expect(screen.getByText('University of Cebu')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Certifications' }),
    ).toBeInTheDocument();
    expect(screen.getByText('AWS Cloud Practitioner')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'Open AWS Cloud Practitioner credential',
      }),
    ).toHaveAttribute('href', 'https://example.com/aws');

    expect(screen.getByText('Portfolio API')).toBeInTheDocument();
    expect(screen.getByText('Mobile Guide')).toBeInTheDocument();
    expect(screen.getByText('AWS Uploads')).toBeInTheDocument();
    expect(screen.queryByText('Fourth Project')).not.toBeInTheDocument();
    expect(screen.getByAltText('Portfolio API project image')).toHaveAttribute(
      'src',
      'https://example.com/image.png',
    );
    expect(
      screen.queryByAltText('Mobile Guide project image'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'View all projects' }));
    expect(window.location.pathname).toBe('/projects');

    fireEvent.click(
      screen.getByRole('link', { name: 'View Portfolio API project details' }),
    );
    expect(window.location.pathname).toBe('/projects/portfolio-api');
  });

  it('handles loading, missing-profile, empty-project, API-error, and retry states', () => {
    mockedProfileQueries.usePublicProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchPublicProfile,
    } as unknown as ReturnType<typeof profileQueries.usePublicProfile>);
    mockedProjectQueries.usePublicProjects.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchPublicProjects,
    } as unknown as ReturnType<typeof projectQueries.usePublicProjects>);
    mockedExperienceQueries.usePublicExperiences.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchPublicExperiences,
    } as unknown as ReturnType<typeof experienceQueries.usePublicExperiences>);
    mockedResumeQueries.usePublicResume.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchPublicResume,
    } as unknown as ReturnType<typeof resumeQueries.usePublicResume>);
    mockedCredentialsQueries.usePublicEducations.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchPublicEducations,
    } as unknown as ReturnType<typeof credentialsQueries.usePublicEducations>);
    mockedCredentialsQueries.usePublicCertifications.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchPublicCertifications,
    } as unknown as ReturnType<
      typeof credentialsQueries.usePublicCertifications
    >);
    mockedProjectQueries.usePublicProject.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchPublicProject,
    } as unknown as ReturnType<typeof projectQueries.usePublicProject>);

    const { rerender } = renderApp('/');

    expect(screen.getByText('Loading profile')).toBeInTheDocument();
    expect(screen.getByText('Loading projects')).toBeInTheDocument();
    expect(screen.getByText('Loading experience')).toBeInTheDocument();
    expect(screen.getByText('Loading education')).toBeInTheDocument();
    expect(screen.getByText('Loading certifications')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Download .* CV/ }),
    ).not.toBeInTheDocument();

    mockedProfileQueries.usePublicProfile.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchPublicProfile,
    } as unknown as ReturnType<typeof profileQueries.usePublicProfile>);
    mockedProjectQueries.usePublicProjects.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchPublicProjects,
    } as unknown as ReturnType<typeof projectQueries.usePublicProjects>);
    mockedExperienceQueries.usePublicExperiences.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchPublicExperiences,
    } as unknown as ReturnType<typeof experienceQueries.usePublicExperiences>);
    mockedResumeQueries.usePublicResume.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchPublicResume,
    } as unknown as ReturnType<typeof resumeQueries.usePublicResume>);
    mockPublicCredentialHooks();
    rerender(<App />);

    expect(
      screen.getByText('Profile information is not available yet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No public projects are available.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Skills will appear when public projects are available.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No public experience entries are available.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Education' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Certifications' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Download .* CV/ }),
    ).not.toBeInTheDocument();

    mockedProfileQueries.usePublicProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('profile failed'),
      refetch: refetchPublicProfile,
    } as unknown as ReturnType<typeof profileQueries.usePublicProfile>);
    mockedProjectQueries.usePublicProjects.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('projects failed'),
      refetch: refetchPublicProjects,
    } as unknown as ReturnType<typeof projectQueries.usePublicProjects>);
    mockedExperienceQueries.usePublicExperiences.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('experience failed'),
      refetch: refetchPublicExperiences,
    } as unknown as ReturnType<typeof experienceQueries.usePublicExperiences>);
    mockedResumeQueries.usePublicResume.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('resume failed'),
      refetch: refetchPublicResume,
    } as unknown as ReturnType<typeof resumeQueries.usePublicResume>);
    mockedCredentialsQueries.usePublicEducations.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('education failed'),
      refetch: refetchPublicEducations,
    } as unknown as ReturnType<typeof credentialsQueries.usePublicEducations>);
    mockedCredentialsQueries.usePublicCertifications.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('certifications failed'),
      refetch: refetchPublicCertifications,
    } as unknown as ReturnType<
      typeof credentialsQueries.usePublicCertifications
    >);
    rerender(<App />);

    expect(screen.getByText('profile failed')).toBeInTheDocument();
    expect(screen.getByText('projects failed')).toBeInTheDocument();
    expect(screen.getByText('experience failed')).toBeInTheDocument();
    expect(screen.getByText('education failed')).toBeInTheDocument();
    expect(screen.getByText('certifications failed')).toBeInTheDocument();
    expect(screen.queryByText('resume failed')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Download .* CV/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry profile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry projects' }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry experience' }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry education' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry certifications' }),
    );
    expect(refetchPublicProfile).toHaveBeenCalled();
    expect(refetchPublicProjects).toHaveBeenCalled();
    expect(refetchPublicExperiences).toHaveBeenCalled();
    expect(refetchPublicEducations).toHaveBeenCalled();
    expect(refetchPublicCertifications).toHaveBeenCalled();
  });

  it('shows public homepage timeline in public order and hides unpublished entries defensively', () => {
    mockPublicExperienceHooks([
      experience({
        id: 'experience-1',
        company: 'StepCast',
        role: 'Lead Mobile Developer',
        displayOrder: 0,
        isPublic: true,
      }),
      experience({
        id: 'experience-2',
        company: 'Hidden Co',
        role: 'Internal Role',
        displayOrder: 1,
        isPublic: false,
      }),
    ]);

    renderApp('/');

    expect(screen.getByText('Lead Mobile Developer')).toBeInTheDocument();
    expect(screen.getByText('StepCast')).toBeInTheDocument();
    expect(screen.queryByText('Internal Role')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden Co')).not.toBeInTheDocument();
  });

  it('omits credentials sections when public APIs return disabled, empty, or unpublished-only lists', () => {
    mockPublicCredentialHooks({
      educations: [],
      certifications: [],
    });

    renderApp('/');

    expect(
      screen.queryByRole('heading', { name: 'Education' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Certifications' }),
    ).not.toBeInTheDocument();
  });

  it('keeps education single-column when certifications are hidden', () => {
    mockPublicCredentialHooks({
      educations: [education()],
      certifications: [],
    });

    renderApp('/');

    const educationSection = screen
      .getByRole('heading', { name: 'Education' })
      .closest('section');
    const educationList = educationSection?.querySelector('ol');

    expect(educationList).not.toBeNull();
    expect(educationList).not.toHaveClass('md:grid-cols-2');
    expect(
      screen.queryByRole('heading', { name: 'Certifications' }),
    ).not.toBeInTheDocument();
  });

  it('sets route-aware public metadata', async () => {
    mockPublicProfileHook();
    mockPublicProjectHooks([project()]);

    renderApp('/');

    expect(document.title).toBe('Jastine Formentera | Portfolio');
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
    ).toContain('Full-stack developer');

    fireEvent.click(screen.getByRole('link', { name: 'View all projects' }));
    expect(window.location.pathname).toBe('/projects');
    await waitFor(() =>
      expect(document.title).toBe('Projects | AntinOS Portfolio'),
    );

    fireEvent.click(
      screen.getByRole('link', { name: 'View Portfolio API project details' }),
    );
    expect(window.location.pathname).toBe('/projects/portfolio-api');
    await waitFor(() =>
      expect(document.title).toBe('Portfolio API | AntinOS Portfolio'),
    );
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
    ).toBe('A portfolio API');
  });
});

describe('public projects', () => {
  it('renders public projects from the public query and navigates to detail', () => {
    const publicProject = project();
    const unpublishedProject = project({
      id: 'project-2',
      title: 'Internal Tool',
      slug: 'internal-tool',
      isPublic: false,
    });
    mockPublicProjectHooks([publicProject]);
    mockedProjectQueries.useProjects.mockImplementation(() => {
      throw new Error('Managed projects query should not run on public pages');
    });
    mockedProjectQueries.useProject.mockImplementation(() => {
      throw new Error('Managed project query should not run on public pages');
    });

    renderApp('/projects');

    expect(mockedAuthQueries.useAdminSession).toHaveBeenCalledWith(false);
    expect(
      screen.getByRole('heading', { name: 'Projects' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Portfolio API')).toBeInTheDocument();
    expect(screen.getByText('A portfolio API')).toBeInTheDocument();
    expect(screen.getByAltText('Portfolio API project image')).toHaveAttribute(
      'src',
      'https://example.com/image.png',
    );
    expect(screen.getByText('NestJS')).toBeInTheDocument();
    expect(screen.getByText('Prisma')).toBeInTheDocument();
    expect(
      screen.queryByText(unpublishedProject.title),
    ).not.toBeInTheDocument();
    expect(mockedProjectQueries.useProjects).not.toHaveBeenCalled();
    expect(mockedProjectQueries.useProject).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('link', {
        name: 'View Portfolio API project details',
      }),
    );

    expect(window.location.pathname).toBe('/projects/portfolio-api');
  });

  it('shows public list loading, empty, and API-error states with retry', () => {
    mockPublicProjectHooks();
    mockedProjectQueries.usePublicProjects.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchPublicProjects,
    } as unknown as ReturnType<typeof projectQueries.usePublicProjects>);

    const { rerender } = renderApp('/projects');

    expect(screen.getByRole('status')).toHaveTextContent('Loading projects');

    mockedProjectQueries.usePublicProjects.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchPublicProjects,
    } as unknown as ReturnType<typeof projectQueries.usePublicProjects>);
    rerender(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'No public projects are available.',
    );

    mockedProjectQueries.usePublicProjects.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('public load failed'),
      refetch: refetchPublicProjects,
    } as unknown as ReturnType<typeof projectQueries.usePublicProjects>);
    rerender(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent('public load failed');
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry public projects' }),
    );
    expect(refetchPublicProjects).toHaveBeenCalled();
  });

  it('renders public project detail fields, optional links, and back navigation', () => {
    const publicProject = project();
    mockPublicProjectHooks([publicProject]);
    mockedProjectQueries.useProject.mockImplementation(() => {
      throw new Error('Managed project query should not run on public pages');
    });

    renderApp('/projects/portfolio-api');

    expect(mockedProjectQueries.usePublicProject).toHaveBeenCalledWith(
      'portfolio-api',
    );
    expect(mockedProjectQueries.useProject).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: 'Portfolio API' }),
    ).toBeInTheDocument();
    expect(screen.getByText('A portfolio API')).toBeInTheDocument();
    expect(screen.getByText('Detailed description')).toBeInTheDocument();
    expect(screen.getByAltText('Portfolio API project image')).toHaveAttribute(
      'src',
      'https://example.com/image.png',
    );
    expect(
      screen.getByRole('link', { name: 'Open Portfolio API repository' }),
    ).toHaveAttribute('href', 'https://github.com/example/repo');
    expect(
      screen.getByRole('link', { name: 'Open Portfolio API live demo' }),
    ).toHaveAttribute('href', 'https://example.com');

    fireEvent.click(
      screen.getByRole('link', { name: 'Back to public projects' }),
    );

    expect(window.location.pathname).toBe('/projects');
  });

  it('renders published case studies and hides draft-only case-study content', () => {
    const publicCaseStudy = caseStudy({
      responsibilities: ['Owned the API design', 'Built the admin workflow'],
      technicalChallenges: ['Prevented draft content leaks'],
      outcomes: ['Improved recruiter scanning'],
    });
    mockPublicProjectHooks([project({ caseStudy: publicCaseStudy })]);

    renderApp('/projects/portfolio-api');

    expect(
      screen.getByRole('heading', { name: 'How this project was built' }),
    ).toBeInTheDocument();
    expect(screen.getByText(publicCaseStudy.context)).toBeInTheDocument();
    expect(screen.getByText(publicCaseStudy.problem)).toBeInTheDocument();
    expect(screen.getByText('Owned the API design')).toBeInTheDocument();
    expect(
      screen.getByText('Prevented draft content leaks'),
    ).toBeInTheDocument();
    expect(screen.getByText('Improved recruiter scanning')).toBeInTheDocument();

    mockPublicProjectHooks([
      project({
        slug: 'draft-case-study',
        caseStudy: null,
      }),
    ]);
    window.history.pushState({}, '', '/projects/draft-case-study');
    cleanup();
    render(<App />);

    expect(
      screen.queryByRole('heading', { name: 'How this project was built' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Recruiters need to understand the technical tradeoffs.',
      ),
    ).not.toBeInTheDocument();
  });

  it('omits optional public detail fields when URLs, image, and description are absent', () => {
    const minimalProject = project({
      title: 'Minimal Project',
      slug: 'minimal-project',
      description: null,
      repoUrl: null,
      liveUrl: null,
      imageUrl: null,
    });
    mockPublicProjectHooks([minimalProject]);

    renderApp('/projects/minimal-project');

    expect(screen.getByText('Minimal Project')).toBeInTheDocument();
    expect(
      screen.queryByAltText('Minimal Project project image'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Open Minimal Project repository' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Open Minimal Project live demo' }),
    ).not.toBeInTheDocument();
  });

  it('shows detail loading, not-found, and API-error states with retry', () => {
    mockPublicProjectHooks();
    mockedProjectQueries.usePublicProject.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchPublicProject,
    } as unknown as ReturnType<typeof projectQueries.usePublicProject>);

    const { rerender } = renderApp('/projects/missing-project');

    expect(screen.getByRole('status')).toHaveTextContent('Loading project');

    mockedProjectQueries.usePublicProject.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Request failed with status 404'),
      refetch: refetchPublicProject,
    } as unknown as ReturnType<typeof projectQueries.usePublicProject>);
    rerender(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Project not found');
    expect(
      screen.getByRole('link', { name: 'View all public projects' }),
    ).toHaveAttribute('href', '/projects');

    mockedProjectQueries.usePublicProject.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('server unavailable'),
      refetch: refetchPublicProject,
    } as unknown as ReturnType<typeof projectQueries.usePublicProject>);
    rerender(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent('server unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry project' }));
    expect(refetchPublicProject).toHaveBeenCalled();
  });
});

describe('projects admin list', () => {
  it('shows loading, empty, and error states with retry', () => {
    mockProfileHooks();
    mockProjectHooks();
    mockedProjectQueries.useProjects.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchProjects,
    } as unknown as ReturnType<typeof projectQueries.useProjects>);

    const { rerender } = renderApp('/admin/projects');

    expect(screen.getByRole('status')).toHaveTextContent('Loading projects');

    mockedProjectQueries.useProjects.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchProjects,
    } as unknown as ReturnType<typeof projectQueries.useProjects>);
    rerender(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'No matching projects are available.',
    );

    mockedProjectQueries.useProjects.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('load failed'),
      refetch: refetchProjects,
    } as unknown as ReturnType<typeof projectQueries.useProjects>);
    rerender(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent('load failed');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetchProjects).toHaveBeenCalled();
  });

  it('lists projects, filters by publication state, and opens delete dialog', async () => {
    const publicProject = project();
    const privateProject = project({
      id: 'project-2',
      title: 'Internal Tool',
      slug: 'internal-tool',
      isPublic: false,
      techStack: ['React'],
    });
    mockProfileHooks();
    mockProjectHooks([publicProject, privateProject]);
    deleteProject.mockImplementation(async () => {
      mockedProjectQueries.useProjects.mockReturnValue({
        data: [publicProject],
        isLoading: false,
        isError: false,
        error: null,
        refetch: refetchProjects,
      } as unknown as ReturnType<typeof projectQueries.useProjects>);

      return privateProject;
    });

    renderApp('/admin/projects');

    expect(screen.getAllByText('Portfolio API')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Internal Tool')[0]).toBeInTheDocument();
    expect(screen.getAllByText('NestJS, Prisma')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Public')[0]).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Unpublished' }));
    expect(screen.queryByText('Portfolio API')).not.toBeInTheDocument();
    expect(screen.getAllByText('Internal Tool')[0]).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Delete Internal Tool' })[0],
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Delete Internal Tool?',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deleteProject).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Delete Internal Tool' })[0],
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete',
      }),
    );

    await waitFor(() =>
      expect(deleteProject).toHaveBeenCalledWith('project-2'),
    );
    await waitFor(() =>
      expect(screen.queryByText('Internal Tool')).not.toBeInTheDocument(),
    );
  });

  it('keeps the project visible and displays API error when deletion fails', async () => {
    mockProfileHooks();
    mockProjectHooks([project()]);
    deleteProject.mockRejectedValue(new Error('delete failed'));

    renderApp('/admin/projects');

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Delete Portfolio API' })[0],
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete',
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('delete failed');
    expect(screen.getAllByText('Portfolio API')[0]).toBeInTheDocument();
  });

  it('disables duplicate delete submissions while deletion is pending', () => {
    mockProfileHooks();
    mockProjectHooks([project()]);
    mockedProjectMutations.useDeleteProjectMutation.mockReturnValue({
      mutateAsync: deleteProject,
      isPending: true,
    } as unknown as ReturnType<
      typeof projectMutations.useDeleteProjectMutation
    >);

    renderApp('/admin/projects');

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Delete Portfolio API' })[0],
    );

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Deleting' }),
    ).toBeDisabled();
  });
});

describe('experience admin', () => {
  it('shows loading, empty, and error states with retry', () => {
    mockedExperienceQueries.useExperiences.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchExperiences,
    } as unknown as ReturnType<typeof experienceQueries.useExperiences>);

    const { rerender } = renderApp('/admin/experience');

    expect(screen.getByRole('status')).toHaveTextContent('Loading experience');

    mockedExperienceQueries.useExperiences.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchExperiences,
    } as unknown as ReturnType<typeof experienceQueries.useExperiences>);
    rerender(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'No experience entries are available.',
    );

    mockedExperienceQueries.useExperiences.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('experience load failed'),
      refetch: refetchExperiences,
    } as unknown as ReturnType<typeof experienceQueries.useExperiences>);
    rerender(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'experience load failed',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetchExperiences).toHaveBeenCalled();
  });

  it('creates private experience entries with normalized fields and client validation', async () => {
    createExperience.mockResolvedValue(experience({ isPublic: false }));

    renderApp('/admin/experience');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findAllByText('This field is required.')).toHaveLength(
      4,
    );
    expect(screen.getByText('Start date is required.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Achievements')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Technologies')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Company'), {
      target: { value: ' StepCast ' },
    });
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: ' Lead Mobile Developer ' },
    });
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: ' Remote ' },
    });
    fireEvent.change(screen.getByLabelText('Employment type'), {
      target: { value: 'Contract' },
    });
    fireEvent.change(screen.getByLabelText('Start date'), {
      target: { value: '2025-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Summary'), {
      target: { value: ' Built the app. ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(createExperience).toHaveBeenCalledWith({
        company: 'StepCast',
        role: 'Lead Mobile Developer',
        location: 'Remote',
        employmentType: 'Contract',
        startDate: '2025-01-01',
        endDate: null,
        isCurrent: false,
        summary: 'Built the app.',
        achievements: [],
        technologies: [],
        displayOrder: 0,
        isPublic: false,
      }),
    );
  });

  it('validates date rules, current-role exclusivity, and display order', async () => {
    const errors = validateExperienceForm({
      company: 'Company',
      role: 'Role',
      location: 'Remote',
      employmentType: 'Full-time',
      startDate: '2025-01-01',
      endDate: '2024-01-01',
      isCurrent: false,
      summary: 'Summary',
      displayOrder: '-1',
      isPublic: false,
    });

    expect(errors.endDate).toBe('End date cannot be before start date.');
    expect(errors.displayOrder).toBe(
      'Display order must be a non-negative integer.',
    );

    renderApp('/admin/experience');

    fireEvent.input(screen.getByLabelText('End date'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.click(screen.getByLabelText('Current role'));

    expect(screen.getByLabelText('End date')).toBeDisabled();
    expect(screen.getByLabelText('End date')).toHaveValue('');
  });

  it('edits, publishes, deletes, and reorders experience entries', async () => {
    const first = experience();
    const second = experience({
      id: 'experience-2',
      company: 'AntinOS',
      role: 'Full-stack Developer',
      isCurrent: false,
      endDate: '2026-01-01T00:00:00.000Z',
      isPublic: false,
      displayOrder: 1,
    });
    mockExperienceHooks([first, second]);
    updateExperience.mockResolvedValue(
      experience({ role: 'Senior Mobile Developer' }),
    );
    deleteExperience.mockResolvedValue(second);
    reorderExperiences.mockResolvedValue([second, first]);

    renderApp('/admin/experience');

    expect(screen.getAllByText('StepCast')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Lead Mobile Developer')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Contract')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Public, Current')[0]).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Publish Full-stack Developer at AntinOS',
      })[0],
    );
    await waitFor(() =>
      expect(updateExperience).toHaveBeenCalledWith({
        id: 'experience-2',
        input: { isPublic: true },
      }),
    );

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Edit Lead Mobile Developer at StepCast',
      })[0],
    );
    expect(screen.getByLabelText('Company')).toHaveValue('StepCast');
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'Senior Mobile Developer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(updateExperience).toHaveBeenCalledWith({
        id: 'experience-1',
        input: expect.objectContaining({ role: 'Senior Mobile Developer' }),
      }),
    );

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Move Lead Mobile Developer at StepCast down',
      })[0],
    );
    await waitFor(() =>
      expect(reorderExperiences).toHaveBeenCalledWith({
        items: [
          { id: 'experience-2', displayOrder: 0 },
          { id: 'experience-1', displayOrder: 1 },
        ],
      }),
    );

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Delete Full-stack Developer at AntinOS',
      })[0],
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Delete Full-stack Developer at AntinOS?',
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete',
      }),
    );

    await waitFor(() =>
      expect(deleteExperience).toHaveBeenCalledWith('experience-2'),
    );
  });

  it('keeps entries visible and displays API errors when deletion or reorder fails', async () => {
    mockExperienceHooks([experience()]);
    deleteExperience.mockRejectedValue(new Error('delete failed'));
    reorderExperiences.mockRejectedValue(new Error('reorder failed'));

    renderApp('/admin/experience');

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Delete Lead Mobile Developer at StepCast',
      })[0],
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete',
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('delete failed');
    expect(screen.getAllByText('StepCast')[0]).toBeInTheDocument();
  });

  it('disables duplicate submissions while experience mutations are pending', () => {
    mockExperienceHooks([experience()]);
    mockedExperienceMutations.useCreateExperienceMutation.mockReturnValue({
      mutateAsync: createExperience,
      isPending: true,
    } as unknown as ReturnType<
      typeof experienceMutations.useCreateExperienceMutation
    >);
    mockedExperienceMutations.useDeleteExperienceMutation.mockReturnValue({
      mutateAsync: deleteExperience,
      isPending: true,
    } as unknown as ReturnType<
      typeof experienceMutations.useDeleteExperienceMutation
    >);
    mockedExperienceMutations.useReorderExperiencesMutation.mockReturnValue({
      mutateAsync: reorderExperiences,
      isPending: true,
    } as unknown as ReturnType<
      typeof experienceMutations.useReorderExperiencesMutation
    >);

    renderApp('/admin/experience');

    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
    expect(
      screen.getAllByRole('button', {
        name: 'Move Lead Mobile Developer at StepCast down',
      })[0],
    ).toBeDisabled();

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Delete Lead Mobile Developer at StepCast',
      })[0],
    );

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Deleting' }),
    ).toBeDisabled();
  });
});

describe('credentials admin', () => {
  it('updates public-section toggles with pending, success, and error feedback', async () => {
    updatePortfolioSettings.mockResolvedValue(
      portfolioSettings({ showEducation: true }),
    );

    renderApp('/admin/credentials');

    expect(
      screen.getByText(/hides it publicly without deleting entries/i),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Show Education on public portfolio',
      }),
    );

    await waitFor(() =>
      expect(updatePortfolioSettings).toHaveBeenCalledWith({
        showEducation: true,
      }),
    );
    expect(
      await screen.findByText('Visibility settings saved.'),
    ).toBeInTheDocument();

    updatePortfolioSettings.mockRejectedValue(new Error('settings failed'));
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Show Certifications on public portfolio',
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'settings failed',
    );
  });

  it('disables public-section toggles while a visibility update is pending', () => {
    mockedCredentialsMutations.useUpdatePortfolioSettingsMutation.mockReturnValue(
      {
        mutateAsync: updatePortfolioSettings,
        isPending: true,
      } as unknown as ReturnType<
        typeof credentialsMutations.useUpdatePortfolioSettingsMutation
      >,
    );

    renderApp('/admin/credentials');

    expect(
      screen.getByRole('checkbox', {
        name: 'Show Education on public portfolio',
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole('checkbox', {
        name: 'Show Certifications on public portfolio',
      }),
    ).toBeDisabled();
  });

  it('manages education and certifications while sections are disabled publicly', async () => {
    mockCredentialsHooks({
      settings: portfolioSettings({
        showEducation: false,
        showCertifications: false,
      }),
      educations: [education({ isPublic: false })],
      certifications: [certification({ isPublic: false })],
    });
    createEducation.mockResolvedValue(education({ isPublic: false }));
    updateEducation.mockResolvedValue(education());
    createCertification.mockResolvedValue(certification({ isPublic: false }));
    updateCertification.mockResolvedValue(certification());

    renderApp('/admin/credentials');

    expect(
      screen.getByRole('checkbox', {
        name: 'Show Education on public portfolio',
      }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', {
        name: 'Show Certifications on public portfolio',
      }),
    ).not.toBeChecked();
    expect(
      screen.getAllByText('BS Information Technology')[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('AWS Cloud Practitioner')[0],
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Institution'), {
      target: { value: ' University of Cebu ' },
    });
    fireEvent.change(screen.getByLabelText('Credential or degree'), {
      target: { value: ' BS Information Technology ' },
    });
    fireEvent.change(screen.getByLabelText('Field of study'), {
      target: { value: ' Software Development ' },
    });
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: ' Cebu ' },
    });
    fireEvent.change(screen.getAllByLabelText('Summary')[0], {
      target: { value: ' Studied software engineering. ' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]);

    await waitFor(() =>
      expect(createEducation).toHaveBeenCalledWith({
        institution: 'University of Cebu',
        credential: 'BS Information Technology',
        fieldOfStudy: 'Software Development',
        location: 'Cebu',
        startDate: null,
        endDate: null,
        summary: 'Studied software engineering.',
        displayOrder: 0,
        isPublic: false,
      }),
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: ' AWS Cloud Practitioner ' },
    });
    fireEvent.change(screen.getByLabelText('Issuer'), {
      target: { value: ' Amazon Web Services ' },
    });
    fireEvent.change(screen.getByLabelText('Credential URL'), {
      target: { value: ' https://example.com/aws ' },
    });
    fireEvent.change(screen.getAllByLabelText('Summary')[1], {
      target: { value: ' Cloud fundamentals. ' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[1]);

    await waitFor(() =>
      expect(createCertification).toHaveBeenCalledWith({
        name: 'AWS Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issueDate: null,
        expirationDate: null,
        credentialId: null,
        credentialUrl: 'https://example.com/aws',
        summary: 'Cloud fundamentals.',
        displayOrder: 0,
        isPublic: false,
      }),
    );

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Publish BS Information Technology at University of Cebu',
      })[0],
    );
    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Publish AWS Cloud Practitioner from Amazon Web Services',
      })[0],
    );

    await waitFor(() =>
      expect(updateEducation).toHaveBeenCalledWith({
        id: 'education-1',
        input: { isPublic: true },
      }),
    );
    await waitFor(() =>
      expect(updateCertification).toHaveBeenCalledWith({
        id: 'certification-1',
        input: { isPublic: true },
      }),
    );
  });

  it('shows credential loading, empty, error, deletion, and reorder states', async () => {
    mockedCredentialsQueries.useEducations.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchEducations,
    } as unknown as ReturnType<typeof credentialsQueries.useEducations>);

    const { rerender } = renderApp('/admin/credentials');

    expect(screen.getByText('Loading education')).toBeInTheDocument();

    mockedCredentialsQueries.useEducations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchEducations,
    } as unknown as ReturnType<typeof credentialsQueries.useEducations>);
    rerender(<App />);

    expect(
      screen.getByText('No education entries are available.'),
    ).toBeInTheDocument();

    mockedCredentialsQueries.useEducations.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('education load failed'),
      refetch: refetchEducations,
    } as unknown as ReturnType<typeof credentialsQueries.useEducations>);
    rerender(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'education load failed',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetchEducations).toHaveBeenCalled();

    mockCredentialsHooks({
      educations: [
        education(),
        education({
          id: 'education-2',
          institution: 'Another School',
          credential: 'Diploma',
          displayOrder: 1,
        }),
      ],
    });
    deleteEducation.mockRejectedValue(new Error('delete failed'));
    reorderEducations.mockRejectedValue(new Error('reorder failed'));
    rerender(<App />);

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Move BS Information Technology at University of Cebu down',
      })[0],
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'reorder failed',
    );

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Delete BS Information Technology at University of Cebu',
      })[0],
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Delete BS Information Technology at University of Cebu?',
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete',
      }),
    );

    expect(await screen.findByText('delete failed')).toBeInTheDocument();
  });
});

describe('resume admin', () => {
  it('shows loading, empty, and error states with retry', () => {
    mockedResumeQueries.useResume.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchResume,
    } as unknown as ReturnType<typeof resumeQueries.useResume>);

    const { rerender } = renderApp('/admin/resume');

    expect(screen.getByRole('status')).toHaveTextContent('Loading resume');

    mockedResumeQueries.useResume.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchResume,
    } as unknown as ReturnType<typeof resumeQueries.useResume>);
    rerender(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'No resume is available.',
    );

    mockedResumeQueries.useResume.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('resume load failed'),
      refetch: refetchResume,
    } as unknown as ReturnType<typeof resumeQueries.useResume>);
    rerender(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent('resume load failed');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetchResume).toHaveBeenCalled();
  });

  it('validates and uploads a new resume PDF', async () => {
    uploadResume.mockImplementation(async (input) => {
      input.onProgress(67);
      return resume({ isPublic: false });
    });

    const view = renderApp('/admin/resume');

    fireEvent.change(screen.getByLabelText('PDF file'), {
      target: {
        files: [new File(['not pdf'], 'resume.txt', { type: 'text/plain' })],
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a PDF file.');

    const pdf = new File(['%PDF-1.4\n%%EOF'], 'Jastine-CV.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(screen.getByLabelText('PDF file'), {
      target: { files: [pdf] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload PDF' }));

    await waitFor(() =>
      expect(uploadResume).toHaveBeenCalledWith({
        file: pdf,
        fileName: 'Jastine-CV.pdf',
        onProgress: expect.any(Function),
      }),
    );
    expect(await screen.findByText('Resume uploaded')).toBeInTheDocument();
  });

  it('confirms replacement, publishes, unpublishes, and removes a resume', async () => {
    const currentResume = resume({ isPublic: false });
    mockResumeHooks(currentResume);
    uploadResume.mockResolvedValue(resume({ isPublic: false }));
    updateResumePublication.mockResolvedValue(resume({ isPublic: true }));
    deleteResume.mockResolvedValue(currentResume);

    const view = renderApp('/admin/resume');

    expect(screen.getByText('Jastine-CV.pdf')).toBeInTheDocument();
    expect(screen.getAllByText('Private').length).toBeGreaterThan(0);

    const pdf = new File(['%PDF-1.4\n%%EOF'], 'New-CV.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(screen.getByLabelText('PDF file'), {
      target: { files: [pdf] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Replace PDF' }));

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Replace Jastine-CV.pdf?',
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Replace',
      }),
    );
    await waitFor(() => expect(uploadResume).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() =>
      expect(updateResumePublication).toHaveBeenCalledWith({ isPublic: true }),
    );

    mockResumeHooks(resume({ isPublic: true }));
    view.rerender(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }));
    await waitFor(() =>
      expect(updateResumePublication).toHaveBeenCalledWith({ isPublic: false }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Remove Jastine-CV.pdf?',
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Remove',
      }),
    );
    await waitFor(() => expect(deleteResume).toHaveBeenCalled());
  });

  it('preserves visible resume and displays API errors when removal fails', async () => {
    mockResumeHooks(resume());
    deleteResume.mockRejectedValue(new Error('delete failed'));

    renderApp('/admin/resume');

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Remove',
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('delete failed');
    expect(screen.getByText('Jastine-CV.pdf')).toBeInTheDocument();
  });

  it('disables duplicate submissions while resume mutations are pending', () => {
    mockResumeHooks(resume());
    mockedResumeMutations.useUploadResumeMutation.mockReturnValue({
      mutateAsync: uploadResume,
      isPending: true,
    } as unknown as ReturnType<typeof resumeMutations.useUploadResumeMutation>);
    mockedResumeMutations.useUpdateResumePublicationMutation.mockReturnValue({
      mutateAsync: updateResumePublication,
      isPending: true,
    } as unknown as ReturnType<
      typeof resumeMutations.useUpdateResumePublicationMutation
    >);
    mockedResumeMutations.useDeleteResumeMutation.mockReturnValue({
      mutateAsync: deleteResume,
      isPending: true,
    } as unknown as ReturnType<typeof resumeMutations.useDeleteResumeMutation>);

    renderApp('/admin/resume');

    expect(screen.getByLabelText('PDF file')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Uploading' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });
});

describe('project form', () => {
  it('creates private projects with generated slugs and normalized tech stack', async () => {
    mockProfileHooks();
    mockProjectHooks();
    createProject.mockResolvedValue(project({ isPublic: false }));

    renderApp('/admin/projects/new');

    expect(screen.getByLabelText('Private')).not.toBeChecked();

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'My New Project' },
    });
    expect(screen.getByLabelText('Slug')).toHaveValue('my-new-project');

    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'custom-slug' },
    });
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Changed Title' },
    });
    expect(screen.getByLabelText('Slug')).toHaveValue('custom-slug');

    fireEvent.change(screen.getByLabelText('Summary'), {
      target: { value: 'Useful project' },
    });
    fireEvent.change(screen.getByLabelText('Tech stack'), {
      target: { value: 'React, NestJS' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Changed Title',
          slug: 'custom-slug',
          summary: 'Useful project',
          techStack: ['React', 'NestJS'],
          isPublic: false,
        }),
      ),
    );
    expect(window.location.pathname).toBe('/admin/projects');
  });

  it('uploads a project image and saves its storage key', async () => {
    mockProfileHooks();
    mockProjectHooks();
    uploadProjectImage.mockImplementation(async ({ onProgress }) => {
      onProgress(100);
      return {
        key: 'project-images/123e4567-e89b-12d3-a456-426614174000.png',
        uploadUrl: 'https://s3.example.com/upload',
        imageUrl: 'https://cdn.example.com/project.png',
      };
    });
    createProject.mockResolvedValue(project({ isPublic: false }));

    renderApp('/admin/projects/new');

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Image Project' },
    });
    fireEvent.change(screen.getByLabelText('Summary'), {
      target: { value: 'Summary' },
    });
    fireEvent.change(screen.getByLabelText('Tech stack'), {
      target: { value: 'React' },
    });
    fireEvent.change(screen.getByLabelText('Project image'), {
      target: { files: [file('image/png')] },
    });

    expect(
      await screen.findByText('Project image uploaded'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          imageKey: 'project-images/123e4567-e89b-12d3-a456-426614174000.png',
          imageUrl: null,
        }),
      ),
    );
  });

  it('validates required fields, slug format, urls, and tech stack entries', async () => {
    renderApp('/admin/projects/new');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Slug is required.')).toBeInTheDocument();
    expect(screen.getByText('Summary is required.')).toBeInTheDocument();
    expect(
      screen.getByText('Add at least one technology.'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'Bad Slug' },
    });
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Bad Slug' },
    });
    fireEvent.change(screen.getByLabelText('Summary'), {
      target: { value: 'Summary' },
    });
    fireEvent.change(screen.getByLabelText('Tech stack'), {
      target: { value: 'React' },
    });
    fireEvent.change(screen.getByLabelText('Repository URL'), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText(
        'Use lowercase kebab-case, for example portfolio-api.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter a valid URL.')).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it('displays API validation errors and keeps create data on the form', async () => {
    mockProfileHooks();
    mockProjectHooks();
    createProject.mockRejectedValue(new Error('Summary is too long'));

    renderApp('/admin/projects/new');

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Validated Project' },
    });
    fireEvent.change(screen.getByLabelText('Summary'), {
      target: { value: 'Summary' },
    });
    fireEvent.change(screen.getByLabelText('Tech stack'), {
      target: { value: 'React' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Summary is too long',
    );
    expect(screen.getByLabelText('Title')).toHaveValue('Validated Project');
    expect(window.location.pathname).toBe('/admin/projects/new');
  });

  it('disables duplicate save submissions while create is pending', () => {
    mockProfileHooks();
    mockProjectHooks();
    mockedProjectMutations.useCreateProjectMutation.mockReturnValue({
      mutateAsync: createProject,
      isPending: true,
    } as unknown as ReturnType<
      typeof projectMutations.useCreateProjectMutation
    >);

    renderApp('/admin/projects/new');

    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
  });

  it('warns before publishing incomplete project information', async () => {
    mockProfileHooks();
    mockProjectHooks();
    createProject.mockResolvedValue(project());

    renderApp('/admin/projects/new');

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Public Project' },
    });
    fireEvent.change(screen.getByLabelText('Summary'), {
      target: { value: 'Summary' },
    });
    fireEvent.change(screen.getByLabelText('Tech stack'), {
      target: { value: 'React' },
    });
    fireEvent.click(screen.getByLabelText('Private'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Publish incomplete project?',
    );
    expect(createProject).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Publish anyway' }));
    await waitFor(() => expect(createProject).toHaveBeenCalled());
  });

  it('edits existing projects and displays duplicate slug conflicts', async () => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing]);
    updateProject.mockRejectedValue(
      new Error('{"message":"Project slug already exists","statusCode":409}'),
    );

    renderApp('/admin/projects/project-1/edit');

    expect(screen.getByLabelText('Title')).toHaveValue('Portfolio API');
    fireEvent.change(screen.getByLabelText('Slug'), {
      target: { value: 'duplicate-slug' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A project with this slug already exists.',
    );
    expect(window.location.pathname).toBe('/admin/projects/project-1/edit');
  });

  it('creates, publishes, unpublishes, and removes project case studies from edit mode', async () => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing], { 'project-1': null });
    createProjectCaseStudy.mockResolvedValue(
      caseStudy({ isPublic: false, responsibilities: ['Built API'] }),
    );
    updateProjectCaseStudy.mockResolvedValue(
      caseStudy({ isPublic: true, responsibilities: ['Built API'] }),
    );
    updateProjectCaseStudyPublication.mockResolvedValue(
      caseStudy({ isPublic: false }),
    );
    deleteProjectCaseStudy.mockResolvedValue(caseStudy());

    const view = renderApp('/admin/projects/project-1/edit');

    fireEvent.click(
      screen.getByRole('button', { name: 'Start case study draft' }),
    );

    const caseStudySection = screen
      .getByRole('heading', { name: 'Project case study' })
      .closest('section');
    expect(caseStudySection).not.toBeNull();
    const editor = within(caseStudySection as HTMLElement);

    fireEvent.change(editor.getByLabelText('Context'), {
      target: { value: ' Portfolio context ' },
    });
    fireEvent.change(editor.getByLabelText('Problem'), {
      target: { value: ' Recruiter problem ' },
    });
    fireEvent.change(editor.getByLabelText('Role'), {
      target: { value: ' Full-stack developer ' },
    });
    fireEvent.change(editor.getByLabelText('Approach'), {
      target: { value: ' Build the workflow ' },
    });
    fireEvent.click(
      editor.getByRole('button', { name: 'Add responsibilities entry' }),
    );
    fireEvent.change(
      editor.getAllByRole('textbox', { name: /^Responsibilities entry/ })[0],
      {
        target: { value: ' Built API ' },
      },
    );
    fireEvent.click(
      editor.getByRole('button', { name: 'Add responsibilities entry' }),
    );
    fireEvent.change(
      editor.getAllByRole('textbox', { name: /^Responsibilities entry/ })[1],
      {
        target: { value: ' Wrote tests ' },
      },
    );
    fireEvent.click(
      editor.getByRole('button', {
        name: 'Move Responsibilities entry 2 up',
      }),
    );
    fireEvent.click(editor.getByRole('button', { name: 'Save draft' }));

    await waitFor(() =>
      expect(createProjectCaseStudy).toHaveBeenCalledWith({
        projectId: 'project-1',
        input: expect.objectContaining({
          context: 'Portfolio context',
          problem: 'Recruiter problem',
          role: 'Full-stack developer',
          approach: 'Build the workflow',
          responsibilities: ['Wrote tests', 'Built API'],
          isPublic: false,
        }),
      }),
    );

    mockProjectHooks([existing], {
      'project-1': caseStudy({
        isPublic: false,
        technicalChallenges: [],
        outcomes: [],
      }),
    });
    view.rerender(<App />);

    const updatedSection = screen
      .getByRole('heading', { name: 'Project case study' })
      .closest('section');
    const updatedEditor = within(updatedSection as HTMLElement);

    fireEvent.click(updatedEditor.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Publish incomplete case study?',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Publish anyway' }));

    await waitFor(() =>
      expect(updateProjectCaseStudy).toHaveBeenCalledWith({
        projectId: 'project-1',
        input: expect.objectContaining({ isPublic: true }),
      }),
    );

    mockProjectHooks([existing], {
      'project-1': caseStudy({ isPublic: true }),
    });
    view.rerender(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }));
    await waitFor(() =>
      expect(updateProjectCaseStudyPublication).toHaveBeenCalledWith({
        projectId: 'project-1',
        input: { isPublic: false },
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove case study' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Remove case study for Portfolio API?',
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Remove',
      }),
    );

    await waitFor(() =>
      expect(deleteProjectCaseStudy).toHaveBeenCalledWith('project-1'),
    );
  });

  it('generates, reviews, accepts, and manually saves an AI case-study draft', async () => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing], { 'project-1': null });
    generateProjectCaseStudyDraft.mockResolvedValue({
      draft: {
        context: 'Generated context',
        problem: 'Generated problem',
        role: 'Generated role',
        approach: 'Generated approach',
        responsibilities: ['Generated responsibility'],
        technicalChallenges: ['Generated challenge'],
        outcomes: ['Generated outcome'],
        lessonsLearned: 'Generated lesson',
        needsConfirmation: ['Confirm the generated outcome.'],
      },
    });
    createProjectCaseStudy.mockResolvedValue(caseStudy({ isPublic: false }));

    renderApp('/admin/projects/project-1/edit');

    fireEvent.change(screen.getByLabelText('Optional owner notes'), {
      target: { value: 'Use only verified details.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate draft' }));

    await waitFor(() =>
      expect(generateProjectCaseStudyDraft).toHaveBeenCalledWith({
        projectId: 'project-1',
        input: { notes: 'Use only verified details.' },
      }),
    );
    expect(
      screen.getByText('Confirm the generated outcome.'),
    ).toBeInTheDocument();
    expect(createProjectCaseStudy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Draft context'), {
      target: { value: 'Reviewed generated context' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Accept into case-study form' }),
    );

    expect(screen.getByLabelText('Context')).toHaveValue(
      'Reviewed generated context',
    );
    expect(createProjectCaseStudy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() =>
      expect(createProjectCaseStudy).toHaveBeenCalledWith({
        projectId: 'project-1',
        input: expect.objectContaining({
          context: 'Reviewed generated context',
          problem: 'Generated problem',
          role: 'Generated role',
          approach: 'Generated approach',
          responsibilities: ['Generated responsibility'],
          technicalChallenges: ['Generated challenge'],
          outcomes: ['Generated outcome'],
          lessonsLearned: 'Generated lesson',
          isPublic: false,
        }),
      }),
    );
  });

  it('starts the AI draft flow by selecting a project from project management', () => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing], { 'project-1': null });

    renderApp('/admin/projects');

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Draft case study for Portfolio API',
      })[0],
    );

    expect(screen.getByRole('heading', { name: 'Edit project' })).toBeVisible();
    expect(screen.getByText('AI draft')).toBeVisible();
    expect(screen.getByLabelText('Optional owner notes')).toBeVisible();
  });

  it('prevents duplicate AI draft submissions while generation is pending', () => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing], { 'project-1': null });
    mockedProjectMutations.useGenerateProjectCaseStudyDraftMutation.mockReturnValue(
      {
        mutateAsync: generateProjectCaseStudyDraft,
        isPending: true,
      } as unknown as ReturnType<
        typeof projectMutations.useGenerateProjectCaseStudyDraftMutation
      >,
    );

    renderApp('/admin/projects/project-1/edit');

    expect(screen.getByRole('button', { name: 'Generating' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Generating AI case-study draft',
    );
    expect(generateProjectCaseStudyDraft).not.toHaveBeenCalled();
  });

  it('warns before accepting an AI draft over current case-study form values', async () => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing], {
      'project-1': caseStudy({ context: 'Current saved context' }),
    });
    generateProjectCaseStudyDraft.mockResolvedValue({
      draft: {
        context: 'Generated context',
        problem: 'Generated problem',
        role: 'Generated role',
        approach: 'Generated approach',
        responsibilities: [],
        technicalChallenges: [],
        outcomes: [],
        lessonsLearned: null,
        needsConfirmation: [],
      },
    });

    renderApp('/admin/projects/project-1/edit');

    fireEvent.click(screen.getByRole('button', { name: 'Generate draft' }));
    await screen.findByDisplayValue('Generated context');
    fireEvent.click(
      screen.getByRole('button', { name: 'Accept into case-study form' }),
    );

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Replace current form values?',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep current values' }),
    );
    expect(screen.getByLabelText('Context')).toHaveValue(
      'Current saved context',
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Accept into case-study form' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Replace form values' }),
    );
    expect(screen.getByLabelText('Context')).toHaveValue('Generated context');
    expect(updateProjectCaseStudy).not.toHaveBeenCalled();
  });

  it('shows AI draft errors and allows retry without saving form data', async () => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing], { 'project-1': null });
    generateProjectCaseStudyDraft
      .mockRejectedValueOnce(
        new Error(
          '{"message":"AI drafting configuration is incomplete","statusCode":503}',
        ),
      )
      .mockResolvedValueOnce({
        draft: {
          context: 'Generated context',
          problem: 'Generated problem',
          role: 'Generated role',
          approach: 'Generated approach',
          responsibilities: [],
          technicalChallenges: [],
          outcomes: [],
          lessonsLearned: null,
          needsConfirmation: [],
        },
      });

    renderApp('/admin/projects/project-1/edit');

    fireEvent.click(screen.getByRole('button', { name: 'Generate draft' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'AI drafting configuration is incomplete',
    );
    expect(createProjectCaseStudy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Retry AI draft' }));
    expect(
      await screen.findByDisplayValue('Generated context'),
    ).toBeInTheDocument();
    expect(createProjectCaseStudy).not.toHaveBeenCalled();
  });

  it.each([
    ['disabled', 'AI drafting is disabled'],
    ['configuration', 'AI drafting configuration is incomplete'],
    ['rate-limit', 'AI draft generation rate limit exceeded'],
    ['usage-limit', 'AI draft generation usage limit exceeded'],
    ['timeout', 'AI draft generation timed out'],
    ['malformed-response', 'AI provider returned a malformed draft'],
    ['provider-error', 'AI provider could not generate a draft'],
  ])('shows AI draft %s error state with retry', async (_state, message) => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing], { 'project-1': null });
    generateProjectCaseStudyDraft.mockRejectedValueOnce(
      new Error(JSON.stringify({ message })),
    );

    renderApp('/admin/projects/project-1/edit');

    fireEvent.click(screen.getByRole('button', { name: 'Generate draft' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(
      screen.getByRole('button', { name: 'Retry AI draft' }),
    ).toBeVisible();
    expect(createProjectCaseStudy).not.toHaveBeenCalled();
    expect(updateProjectCaseStudy).not.toHaveBeenCalled();
  });

  it('preserves case-study form input when API save fails', async () => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing], { 'project-1': null });
    createProjectCaseStudy.mockRejectedValue(new Error('case study failed'));

    renderApp('/admin/projects/project-1/edit');

    fireEvent.click(
      screen.getByRole('button', { name: 'Start case study draft' }),
    );
    fireEvent.change(screen.getByLabelText('Context'), {
      target: { value: 'Kept context' },
    });
    fireEvent.change(screen.getByLabelText('Problem'), {
      target: { value: 'Kept problem' },
    });
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'Kept role' },
    });
    fireEvent.change(screen.getByLabelText('Approach'), {
      target: { value: 'Kept approach' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'case study failed',
    );
    expect(screen.getByLabelText('Context')).toHaveValue('Kept context');
    expect(screen.getByLabelText('Problem')).toHaveValue('Kept problem');
    expect(screen.getByLabelText('Role')).toHaveValue('Kept role');
    expect(screen.getByLabelText('Approach')).toHaveValue('Kept approach');
  });

  it('shows edit loading state and submits updates successfully', async () => {
    const existing = project();
    mockProfileHooks();
    mockProjectHooks([existing]);
    mockedProjectQueries.useProject.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: refetchProject,
    } as unknown as ReturnType<typeof projectQueries.useProject>);

    const { rerender } = renderApp('/admin/projects/project-1/edit');

    expect(screen.getByRole('status')).toHaveTextContent('Loading project');

    mockedProjectQueries.useProject.mockReturnValue({
      data: existing,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchProject,
    } as unknown as ReturnType<typeof projectQueries.useProject>);
    updateProject.mockResolvedValue(project({ summary: 'Updated summary' }));
    rerender(<App />);

    expect(screen.getByLabelText('Title')).toHaveValue('Portfolio API');
    fireEvent.change(screen.getByLabelText('Summary'), {
      target: { value: 'Updated summary' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(updateProject).toHaveBeenCalledWith({
        id: 'project-1',
        input: expect.objectContaining({ summary: 'Updated summary' }),
      }),
    );
    expect(window.location.pathname).toBe('/admin/projects');
  });
});
