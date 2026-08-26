import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobApplication } from '@antin-os/shared';
import * as apiClient from '../api-client';
import { jobApplicationQueryKeys } from '../queries/job-application.queries';
import { useUpdateJobApplicationMutation } from './job-application.mutations';

vi.mock('../api-client', () => ({
  updateJobApplication: vi.fn(),
  createJobApplication: vi.fn(),
  deleteJobApplication: vi.fn(),
}));

const updateJobApplication = vi.mocked(apiClient.updateJobApplication);

const application: JobApplication = {
  id: 'application-1',
  company: 'OpenAI',
  position: 'Product Engineer',
  jobUrl: null,
  source: null,
  salaryRange: null,
  notes: null,
  status: 'saved',
  applicationDate: null,
  interviewDate: null,
  nextActionDate: null,
  followUpNotes: null,
  createdAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-08-27T00:00:00.000Z',
};

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const listKey = jobApplicationQueryKeys.list();
  const detailKey = jobApplicationQueryKeys.detail(application.id);
  const dashboardKey = jobApplicationQueryKeys.dashboard();
  queryClient.setQueryData(listKey, [application]);
  queryClient.setQueryData(detailKey, application);
  queryClient.setQueryData(dashboardKey, {
    total: 1,
    counts: {
      saved: 1,
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  const hook = renderHook(() => useUpdateJobApplicationMutation(), {
    wrapper: Wrapper,
  });
  return { queryClient, hook, listKey, detailKey, dashboardKey };
}

beforeEach(() => {
  updateJobApplication.mockReset();
});

describe('job application mutation consistency', () => {
  it('restores list and detail snapshots after a failed status update', async () => {
    updateJobApplication.mockRejectedValue(new Error('Update failed'));
    const { queryClient, hook, listKey, detailKey } = setup();

    await act(async () => {
      await expect(
        hook.result.current.mutateAsync({
          id: application.id,
          input: { status: 'interview' },
        }),
      ).rejects.toThrow('Update failed');
    });

    expect(
      queryClient.getQueryData<JobApplication[]>(listKey)?.[0]?.status,
    ).toBe('saved');
    expect(queryClient.getQueryData<JobApplication>(detailKey)?.status).toBe(
      'saved',
    );
  });

  it('invalidates list, detail, and dashboard data after success', async () => {
    updateJobApplication.mockResolvedValue({
      ...application,
      status: 'applied',
    });
    const { queryClient, hook, listKey, detailKey, dashboardKey } = setup();

    await act(async () => {
      await hook.result.current.mutateAsync({
        id: application.id,
        input: { status: 'applied' },
      });
    });

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(dashboardKey)?.isInvalidated).toBe(true);
  });
});
