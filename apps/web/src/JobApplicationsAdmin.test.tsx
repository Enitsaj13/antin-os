import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  JobApplication,
  JobApplicationAssistantOperation,
  JobApplicationAssistantResponse,
  JobApplicationDashboardSummary,
} from '@antin-os/shared';
import {
  JobApplicationForm,
  JobApplicationsDashboard,
  JobApplicationsList,
} from './JobApplicationsAdmin';
import * as queries from './queries/job-application.queries';
import * as mutations from './mutations/job-application.mutations';

vi.mock('./queries/job-application.queries');
vi.mock('./mutations/job-application.mutations');

const mockedQueries = vi.mocked(queries);
const mockedMutations = vi.mocked(mutations);
const refetchApplications = vi.fn();
const refetchDashboard = vi.fn();
const refetchDetail = vi.fn();
const createApplication = vi.fn();
const updateApplication = vi.fn();
const deleteApplication = vi.fn();
const generateAssistant = vi.fn();

function application(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 'application-1',
    company: 'OpenAI',
    position: 'Product Engineer',
    jobUrl: 'https://example.com/jobs/1',
    source: 'Referral',
    salaryRange: '$100k-$140k',
    jobDescription: 'Build secure AI career tools.',
    notes: 'Prepare examples.',
    status: 'saved',
    applicationDate: '2026-08-20T00:00:00.000Z',
    interviewDate: null,
    nextActionDate: '2026-08-30T00:00:00.000Z',
    followUpNotes: null,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
    ...overrides,
  };
}

const applications = [
  application(),
  application({
    id: 'application-2',
    company: 'Acme',
    position: 'Platform Engineer',
    source: 'LinkedIn',
    jobDescription: 'Platform infrastructure listing.',
    status: 'interview',
  }),
];

const dashboard: JobApplicationDashboardSummary = {
  total: 2,
  counts: {
    saved: 1,
    applied: 0,
    screening: 0,
    interview: 1,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  },
};

function assistantResponse(
  operation: JobApplicationAssistantOperation,
  overrides: Record<string, unknown> = {},
): JobApplicationAssistantResponse {
  const base = {
    sourceUpdatedAt: applications[0].updatedAt,
    needsConfirmation: ['Confirm the wording.'],
    ...overrides,
  };

  if (operation === 'analyze') {
    return {
      ...base,
      operation,
      suggestedCompany: 'Suggested Company',
      suggestedPosition: 'Suggested Role',
      responsibilities: ['Build reliable interfaces'],
      requiredSkills: ['TypeScript'],
      preferredSkills: ['React'],
      keywords: ['reliability'],
      matchingQualifications: [
        {
          requirement: 'TypeScript',
          qualification: 'Used TypeScript in a managed project.',
          evidence: [
            {
              sourceType: 'project',
              sourceId: 'project-1',
              label: 'Project: Antin OS',
              field: 'techStack',
            },
          ],
        },
      ],
      gaps: [
        {
          requirement: 'Kubernetes',
          reason: 'No managed evidence supports this skill.',
        },
      ],
      unknowns: ['Team size'],
    } as JobApplicationAssistantResponse;
  }

  if (operation === 'interviewQuestions') {
    return {
      ...base,
      operation,
      questions: [
        {
          question: 'How have you used TypeScript?',
          suggestedAnswer: 'I used TypeScript in the cited project.',
          evidence: [
            {
              sourceType: 'project',
              sourceId: 'project-1',
              label: 'Project: Antin OS',
              field: 'techStack',
            },
          ],
          needsConfirmation: false,
        },
      ],
    } as JobApplicationAssistantResponse;
  }

  if (operation === 'nextAction') {
    return {
      ...base,
      operation,
      action: 'Prepare a systems example.',
      rationale: 'The role requires reliable services.',
      suggestedDate: '2026-08-30',
    } as JobApplicationAssistantResponse;
  }

  return {
    ...base,
    operation,
    content: `Editable ${operation} content.`,
  } as JobApplicationAssistantResponse;
}

function mockDefaultHooks() {
  mockedQueries.useJobApplications.mockReturnValue({
    data: applications,
    isLoading: false,
    isError: false,
    refetch: refetchApplications,
  } as unknown as ReturnType<typeof queries.useJobApplications>);
  mockedQueries.useJobApplicationDashboard.mockReturnValue({
    data: dashboard,
    isLoading: false,
    isError: false,
    refetch: refetchDashboard,
  } as unknown as ReturnType<typeof queries.useJobApplicationDashboard>);
  mockedQueries.useJobApplication.mockImplementation(
    (id: string) =>
      ({
        data: applications.find((item) => item.id === id),
        isLoading: false,
        isError: false,
        refetch: refetchDetail,
      }) as unknown as ReturnType<typeof queries.useJobApplication>,
  );
  mockedMutations.useCreateJobApplicationMutation.mockReturnValue({
    mutateAsync: createApplication,
    isPending: false,
  } as unknown as ReturnType<typeof mutations.useCreateJobApplicationMutation>);
  mockedMutations.useUpdateJobApplicationMutation.mockReturnValue({
    mutateAsync: updateApplication,
    isPending: false,
  } as unknown as ReturnType<typeof mutations.useUpdateJobApplicationMutation>);
  mockedMutations.useDeleteJobApplicationMutation.mockReturnValue({
    mutateAsync: deleteApplication,
    isPending: false,
  } as unknown as ReturnType<typeof mutations.useDeleteJobApplicationMutation>);
  mockedMutations.useGenerateJobApplicationAssistantMutation.mockReturnValue({
    mutateAsync: generateAssistant,
    isPending: false,
  } as unknown as ReturnType<
    typeof mutations.useGenerateJobApplicationAssistantMutation
  >);
}

beforeEach(() => {
  refetchApplications.mockReset();
  refetchDashboard.mockReset();
  refetchDetail.mockReset();
  createApplication.mockReset();
  updateApplication.mockReset();
  deleteApplication.mockReset();
  generateAssistant.mockReset();
  mockDefaultHooks();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('job application dashboard and navigation', () => {
  it('renders total, every status count, pipeline progress, and view navigation', () => {
    const onNavigate = vi.fn();
    render(<JobApplicationsDashboard onNavigate={onNavigate} />);

    expect(
      screen.getByRole('heading', { name: 'Job applications' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Total applications')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(7);
    expect(
      screen.getByRole('heading', { name: 'Interview' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Table' }));
    expect(onNavigate).toHaveBeenCalledWith('/admin/job-applications/table');
    fireEvent.click(screen.getByRole('button', { name: 'New application' }));
    expect(onNavigate).toHaveBeenCalledWith('/admin/job-applications/new');
  });

  it('renders an empty dashboard and retries application-safe failures', () => {
    mockedQueries.useJobApplicationDashboard.mockReturnValueOnce({
      data: {
        ...dashboard,
        total: 0,
        counts: { ...dashboard.counts, saved: 0, interview: 0 },
      },
      isLoading: false,
      isError: false,
      refetch: refetchDashboard,
    } as unknown as ReturnType<typeof queries.useJobApplicationDashboard>);
    const { rerender } = render(
      <JobApplicationsDashboard onNavigate={vi.fn()} />,
    );

    expect(screen.getByText(/No job applications yet/)).toBeInTheDocument();

    mockedQueries.useJobApplicationDashboard.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('<html>internal failure</html>'),
      refetch: refetchDashboard,
    } as unknown as ReturnType<typeof queries.useJobApplicationDashboard>);
    rerender(<JobApplicationsDashboard onNavigate={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the job application dashboard.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetchDashboard).toHaveBeenCalled();
  });
});

describe('job application forms', () => {
  it('associates validation errors and retains entries after an API failure', async () => {
    createApplication.mockRejectedValue(
      new Error('{"message":["Job URL is unavailable"],"statusCode":400}'),
    );
    render(<JobApplicationForm mode="create" onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create application' }));
    expect(screen.getByLabelText('Company')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByText('Company is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Company'), {
      target: { value: 'OpenAI' },
    });
    fireEvent.change(screen.getByLabelText('Position'), {
      target: { value: 'Product Engineer' },
    });
    fireEvent.change(screen.getByLabelText('Job URL'), {
      target: { value: 'https://example.com/jobs/1' },
    });
    fireEvent.change(screen.getByLabelText('Follow-up notes'), {
      target: { value: 'Ask about the team.' },
    });
    fireEvent.change(screen.getByLabelText('Job description'), {
      target: { value: 'Keep this private listing.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create application' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Job URL is unavailable',
    );
    expect(screen.getByLabelText('Company')).toHaveValue('OpenAI');
    expect(screen.getByLabelText('Follow-up notes')).toHaveValue(
      'Ask about the team.',
    );
    expect(screen.getByLabelText('Job description')).toHaveValue(
      'Keep this private listing.',
    );
  });

  it('loads every supported edit field and submits without inferred date changes', async () => {
    updateApplication.mockResolvedValue(applications[0]);
    render(
      <JobApplicationForm
        mode="edit"
        applicationId="application-1"
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Company')).toHaveValue('OpenAI');
    expect(screen.getByLabelText('Application date')).toHaveValue('2026-08-20');
    expect(screen.getByLabelText('Interview date')).toHaveValue('');
    expect(screen.getByLabelText('Job description')).toHaveValue(
      'Build secure AI career tools.',
    );

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'screening' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateApplication).toHaveBeenCalled());
    expect(updateApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'application-1',
        input: expect.objectContaining({
          status: 'screening',
          applicationDate: '2026-08-20',
          interviewDate: null,
          jobDescription: 'Build secure AI career tools.',
        }),
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Application updated.',
    );
  });

  it('validates oversized descriptions and supports explicit clearing', async () => {
    updateApplication.mockResolvedValue(application({ jobDescription: null }));
    render(
      <JobApplicationForm
        mode="edit"
        applicationId="application-1"
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Job description'), {
      target: { value: 'x'.repeat(30_001) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      screen.getByText('Keep this field to 30000 characters or fewer.'),
    ).toBeInTheDocument();
    expect(updateApplication).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Job description'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(updateApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ jobDescription: null }),
        }),
      ),
    );
  });

  it('disables form controls while a save is pending', () => {
    mockedMutations.useCreateJobApplicationMutation.mockReturnValue({
      mutateAsync: createApplication,
      isPending: true,
    } as unknown as ReturnType<
      typeof mutations.useCreateJobApplicationMutation
    >);

    render(<JobApplicationForm mode="create" onNavigate={vi.fn()} />);

    expect(screen.getByLabelText('Company')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
  });
});

describe('job application assistant review', () => {
  it('offers only six fixed actions and renders grounded analysis categories', async () => {
    generateAssistant.mockResolvedValue(assistantResponse('analyze'));
    render(
      <JobApplicationForm
        mode="edit"
        applicationId="application-1"
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('button', { name: /^Generate / })).toHaveLength(
      6,
    );
    expect(screen.queryByLabelText(/prompt/i)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Generate Analyze job' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Review Analyze job' }),
    ).toBeInTheDocument();
    for (const heading of [
      'Responsibilities',
      'Required skills',
      'Preferred skills',
      'Keywords',
      'Matching qualifications',
      'Honest gaps',
      'Unknowns',
      'Needs your confirmation',
    ]) {
      expect(
        screen.getByRole('heading', { name: heading }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByText('Project: Antin OS — techStack'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No managed evidence supports this skill.'),
    ).toBeInTheDocument();
  });

  it('requires an exact apply preview before updating a suggested field', async () => {
    generateAssistant.mockResolvedValue(assistantResponse('analyze'));
    updateApplication.mockResolvedValue(
      application({ company: 'Reviewed Company' }),
    );
    render(
      <JobApplicationForm
        mode="edit"
        applicationId="application-1"
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Generate Analyze job' }),
    );
    const company = await screen.findByLabelText('Suggested company');
    fireEvent.change(company, { target: { value: 'Reviewed Company' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply company' }));

    expect(updateApplication).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Confirm apply to Company',
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('replace');
    expect(screen.getByLabelText('Exact resulting value')).toHaveValue(
      'Reviewed Company',
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm apply to Company' }),
    );
    await waitFor(() =>
      expect(updateApplication).toHaveBeenCalledWith({
        id: 'application-1',
        input: { company: 'Reviewed Company' },
      }),
    );
    expect(screen.getByLabelText('Company')).toHaveValue('Reviewed Company');
  });

  it('edits and copies an evidence-grounded interview answer, then can cancel', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    generateAssistant.mockResolvedValue(
      assistantResponse('interviewQuestions'),
    );
    render(
      <JobApplicationForm
        mode="edit"
        applicationId="application-1"
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Generate Interview questions' }),
    );
    const answer = await screen.findByLabelText('Suggested answer');
    fireEvent.change(answer, {
      target: { value: 'My reviewed TypeScript answer.' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy reviewed content' }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('My reviewed TypeScript answer.'),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel review' }));
    expect(screen.queryByLabelText('Suggested answer')).not.toBeInTheDocument();
    expect(updateApplication).not.toHaveBeenCalled();
  });

  it.each([
    ['selfIntroduction', 'Self-introduction'],
    ['coverLetter', 'Cover letter'],
    ['followUpMessage', 'Follow-up message'],
    ['nextAction', 'Next action'],
  ] satisfies Array<[JobApplicationAssistantOperation, string]>)(
    'renders editable review state for %s',
    async (operation, label) => {
      generateAssistant.mockResolvedValue(assistantResponse(operation));
      render(
        <JobApplicationForm
          mode="edit"
          applicationId="application-1"
          onNavigate={vi.fn()}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: `Generate ${label}` }),
      );
      expect(
        await screen.findByRole('heading', { name: `Review ${label}` }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Copy reviewed content' }),
      ).toBeInTheDocument();
    },
  );

  it('previews follow-up and notes destinations without mutation before confirmation', async () => {
    generateAssistant.mockResolvedValue(assistantResponse('followUpMessage'));
    render(
      <JobApplicationForm
        mode="edit"
        applicationId="application-1"
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Generate Follow-up message' }),
    );
    await screen.findByRole('heading', { name: 'Review Follow-up message' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Apply to follow-up notes' }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('Follow-up notes');
    expect(updateApplication).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel apply' }));

    generateAssistant.mockResolvedValue(assistantResponse('coverLetter'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Generate Cover letter' }),
    );
    await screen.findByRole('heading', { name: 'Review Cover letter' });
    fireEvent.click(screen.getByRole('button', { name: 'Append to notes' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Notes (append)');
    expect(
      (screen.getByLabelText('Exact resulting value') as HTMLTextAreaElement)
        .value,
    ).toContain('Prepare examples.');
    expect(updateApplication).not.toHaveBeenCalled();
  });

  it('marks stale output, exposes conscious continuation, retries, and blocks duplicates', async () => {
    generateAssistant
      .mockRejectedValueOnce(new Error('{"message":"AI assistant timed out"}'))
      .mockResolvedValueOnce(
        assistantResponse('analyze', {
          sourceUpdatedAt: '2026-08-20T00:00:00.000Z',
        }),
      );
    const { rerender } = render(
      <JobApplicationForm
        mode="edit"
        applicationId="application-1"
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Generate Analyze job' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'AI assistant timed out',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry Analyze job' }));
    expect(await screen.findByText(/result is stale/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apply position' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'consciously continue',
    );

    mockedMutations.useGenerateJobApplicationAssistantMutation.mockReturnValue({
      mutateAsync: generateAssistant,
      isPending: true,
    } as unknown as ReturnType<
      typeof mutations.useGenerateJobApplicationAssistantMutation
    >);
    rerender(
      <JobApplicationForm
        mode="edit"
        applicationId="application-1"
        onNavigate={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Generate Analyze job' }),
    ).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Generating');
  });

  it('requires the description to be saved before generation', () => {
    mockedQueries.useJobApplication.mockReturnValue({
      data: application({ jobDescription: null }),
      isLoading: false,
      isError: false,
      refetch: refetchDetail,
    } as unknown as ReturnType<typeof queries.useJobApplication>);
    render(
      <JobApplicationForm
        mode="edit"
        applicationId="application-1"
        onNavigate={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Save a non-empty job description/),
    ).toBeInTheDocument();
    for (const button of screen.getAllByRole('button', {
      name: /^Generate /,
    })) {
      expect(button).toBeDisabled();
    }
  });
});

describe('job application table and Kanban', () => {
  it('searches and filters the desktop table while retaining mobile stacked entries', () => {
    render(<JobApplicationsList view="table" onNavigate={vi.fn()} />);
    const table = screen.getByRole('table');

    expect(within(table).getByText('OpenAI')).toBeInTheDocument();
    expect(within(table).getByText('Acme')).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(2);

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'Acme' },
    });
    expect(within(table).queryByText('OpenAI')).not.toBeInTheDocument();
    expect(within(table).getByText('Acme')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'saved' },
    });
    expect(
      screen.getByRole('heading', {
        name: 'No applications match these filters',
      }),
    ).toBeInTheDocument();
  });

  it('matches private descriptions without rendering them in table or mobile rows', () => {
    render(<JobApplicationsList view="table" onNavigate={vi.fn()} />);

    expect(
      screen.queryByText('Build secure AI career tools.'),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'secure AI career' },
    });

    expect(
      within(screen.getByRole('table')).getByText('OpenAI'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('table')).queryByText('Acme'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Build secure AI career tools.'),
    ).not.toBeInTheDocument();
  });

  it('shows loading errors with retry', () => {
    mockedQueries.useJobApplications.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('{"message":"Temporary application error"}'),
      refetch: refetchApplications,
    } as unknown as ReturnType<typeof queries.useJobApplications>);

    render(<JobApplicationsList view="table" onNavigate={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Temporary application error',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetchApplications).toHaveBeenCalled();
  });

  it('renders all seven Kanban groups and reports a failed keyboard status change', async () => {
    updateApplication.mockRejectedValue(
      new Error('{"message":"Status update unavailable"}'),
    );
    render(<JobApplicationsList view="kanban" onNavigate={vi.fn()} />);

    for (const heading of [
      'Saved',
      'Applied',
      'Screening',
      'Interview',
      'Offer',
      'Rejected',
      'Withdrawn',
    ]) {
      expect(
        screen.getByRole('heading', { name: heading }),
      ).toBeInTheDocument();
    }

    const statusControl = screen.getByLabelText(
      'Status for Product Engineer at OpenAI',
    );
    fireEvent.change(statusControl, { target: { value: 'applied' } });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Status update unavailable',
    );
    expect(statusControl).toHaveValue('saved');
  });

  it('identifies permanent deletion and preserves the record and dialog on failure', async () => {
    deleteApplication.mockRejectedValue(
      new Error('{"message":"Deletion unavailable"}'),
    );
    render(<JobApplicationsList view="table" onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('Delete Product Engineer at OpenAI'));
    expect(
      screen.getByRole('heading', {
        name: 'Delete Product Engineer at OpenAI?',
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Deletion unavailable',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('OpenAI');
  });
});
