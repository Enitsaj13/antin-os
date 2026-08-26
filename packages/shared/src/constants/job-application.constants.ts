export const JOB_APPLICATION_STATUSES = [
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

export const JOB_APPLICATION_TEXT_LIMITS = {
  company: 200,
  position: 200,
  jobUrl: 2048,
  source: 200,
  salaryRange: 200,
  notes: 10_000,
  followUpNotes: 10_000,
  search: 200,
} as const;
