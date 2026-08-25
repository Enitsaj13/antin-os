import { useEffect, useMemo } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Download,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import type { Experience, Project } from '@antin-os/shared';
import { usePublicProfile } from './queries/profile.queries';
import { usePublicExperiences } from './queries/experience.queries';
import { usePublicProjects } from './queries/project.queries';
import { usePublicResume } from './queries/resume.queries';
import { setDocumentMetadata } from './metadata';

type Navigate = (path: string) => void;

const PAGE_CLASS = 'mx-auto max-w-6xl px-5 py-8';
const PANEL_CLASS = 'border border-slate-300 bg-white p-5';
const BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-slate-400 bg-white px-3 py-2 text-slate-800 hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60';
const PRIMARY_LINK_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 border border-teal-700 bg-teal-700 px-3 py-2 text-white hover:bg-teal-800';

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  return error.message.trim() || fallback;
}

function projectPath(project: Project) {
  return `/projects/${encodeURIComponent(project.slug)}`;
}

function uniqueSkills(projects: Project[]) {
  const skills = new Map<string, string>();

  for (const project of projects) {
    for (const value of project.techStack) {
      const skill = value.trim();

      if (!skill) {
        continue;
      }

      skills.set(skill.toLowerCase(), skill);
    }
  }

  return [...skills.values()].sort((first, second) =>
    first.localeCompare(second),
  );
}

function formatTimelineDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatExperienceRange(experience: Experience) {
  const endDate = experience.isCurrent
    ? 'Present'
    : experience.endDate
      ? formatTimelineDate(experience.endDate)
      : 'Present';

  return `${formatTimelineDate(experience.startDate)} - ${endDate}`;
}

function ProjectImage({ project }: { project: Project }) {
  if (!project.imageUrl) {
    return null;
  }

  return (
    <img
      className="aspect-video w-full border border-slate-300 object-cover"
      src={project.imageUrl}
      alt={`${project.title} project image`}
    />
  );
}

function TechStack({ values }: { values: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {values.map((technology) => (
        <li
          className="border border-slate-300 bg-slate-50 px-2 py-1 text-sm text-slate-700"
          key={technology}
        >
          {technology}
        </li>
      ))}
    </ul>
  );
}

export function PublicHomePage({ onNavigate }: { onNavigate: Navigate }) {
  const profileQuery = usePublicProfile();
  const projectsQuery = usePublicProjects();
  const experienceQuery = usePublicExperiences();
  const resumeQuery = usePublicResume();
  const profile = profileQuery.data;
  const resume = resumeQuery.data;
  const projects = projectsQuery.data ?? [];
  const experiences = (experienceQuery.data ?? []).filter(
    (experience) => experience.isPublic,
  );
  const highlightedProjects = projects.slice(0, 3);
  const skills = useMemo(() => uniqueSkills(projects), [projects]);

  useEffect(() => {
    const ownerName = profile?.fullName ?? 'AntinOS';
    const headline = profile?.headline ?? 'Portfolio';

    setDocumentMetadata(
      `${ownerName} | Portfolio`,
      `${headline}. Explore profile details, skills, contact links, and selected published projects.`,
    );
  }, [profile]);

  return (
    <main className={PAGE_CLASS}>
      <section className="grid gap-6 border-b border-slate-300 pb-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-start">
        <div className="grid gap-5">
          {profileQuery.isLoading ? <p role="status">Loading profile</p> : null}

          {profileQuery.isError ? (
            <div
              className="grid gap-3 border border-red-300 bg-red-50 p-4"
              role="alert"
            >
              <p className="m-0">
                {errorMessage(profileQuery.error, 'Could not load profile.')}
              </p>
              <button
                className={BUTTON_CLASS}
                type="button"
                onClick={() => void profileQuery.refetch()}
              >
                <RotateCcw size={18} aria-hidden="true" />
                Retry profile
              </button>
            </div>
          ) : null}

          {!profileQuery.isLoading && !profileQuery.isError && !profile ? (
            <section className={PANEL_CLASS} role="status">
              <h1 className="m-0 text-[30px] font-semibold text-slate-950">
                Portfolio profile unavailable
              </h1>
              <p className="m-0 mt-2 text-slate-700">
                Profile information is not available yet.
              </p>
            </section>
          ) : null}

          {!profileQuery.isLoading && !profileQuery.isError && profile ? (
            <header className="grid gap-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {profile.profilePictureUrl ? (
                  <img
                    className="h-32 w-32 border border-slate-300 object-cover"
                    src={profile.profilePictureUrl}
                    alt={`${profile.fullName} profile picture`}
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="m-0 text-sm font-semibold uppercase tracking-wide text-teal-700">
                    Portfolio
                  </p>
                  <h1 className="m-0 text-[36px] font-semibold leading-tight text-slate-950 md:text-[44px]">
                    {profile.fullName}
                  </h1>
                  <p className="m-0 mt-2 text-xl text-slate-700">
                    {profile.headline}
                  </p>
                </div>
              </div>

              <p className="m-0 max-w-3xl whitespace-pre-line text-lg leading-8 text-slate-700">
                {profile.biography}
              </p>

              <div className="flex flex-wrap gap-2" aria-label="Contact links">
                {profile.location ? (
                  <span className={BUTTON_CLASS}>
                    <MapPin size={18} aria-hidden="true" />
                    {profile.location}
                  </span>
                ) : null}
                {profile.email ? (
                  <a className={BUTTON_CLASS} href={`mailto:${profile.email}`}>
                    <Mail size={18} aria-hidden="true" />
                    {profile.email}
                  </a>
                ) : null}
                {profile.githubUrl ? (
                  <a
                    className={BUTTON_CLASS}
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${profile.fullName} GitHub profile`}
                  >
                    <Github size={18} aria-hidden="true" />
                    GitHub
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                ) : null}
                {profile.linkedinUrl ? (
                  <a
                    className={BUTTON_CLASS}
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${profile.fullName} LinkedIn profile`}
                  >
                    <Linkedin size={18} aria-hidden="true" />
                    LinkedIn
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                ) : null}
                {!resumeQuery.isLoading && !resumeQuery.isError && resume ? (
                  <a
                    className={PRIMARY_LINK_CLASS}
                    href={resume.downloadUrl}
                    aria-label={`Download ${profile.fullName} CV`}
                  >
                    <Download size={18} aria-hidden="true" />
                    Download CV
                  </a>
                ) : null}
              </div>
            </header>
          ) : null}
        </div>

        <aside className={PANEL_CLASS} aria-labelledby="skills-heading">
          <h2
            id="skills-heading"
            className="m-0 text-xl font-semibold text-slate-950"
          >
            Skills
          </h2>
          {projectsQuery.isLoading ? (
            <p className="m-0 mt-3" role="status">
              Loading skills
            </p>
          ) : null}
          {!projectsQuery.isLoading && skills.length > 0 ? (
            <div className="mt-4">
              <TechStack values={skills} />
            </div>
          ) : null}
          {!projectsQuery.isLoading &&
          !projectsQuery.isError &&
          !skills.length ? (
            <p className="m-0 mt-3 text-slate-700" role="status">
              Skills will appear when public projects are available.
            </p>
          ) : null}
        </aside>
      </section>

      <section className="mt-8 grid gap-5" aria-labelledby="experience-heading">
        <div>
          <p className="m-0 text-sm font-semibold uppercase tracking-wide text-teal-700">
            Experience
          </p>
          <h2
            id="experience-heading"
            className="m-0 text-[28px] font-semibold text-slate-950"
          >
            Work timeline
          </h2>
        </div>

        {experienceQuery.isLoading ? (
          <p role="status">Loading experience</p>
        ) : null}

        {experienceQuery.isError ? (
          <div
            className="grid gap-3 border border-red-300 bg-red-50 p-4"
            role="alert"
          >
            <p className="m-0">
              {errorMessage(
                experienceQuery.error,
                'Could not load experience.',
              )}
            </p>
            <button
              className={BUTTON_CLASS}
              type="button"
              onClick={() => void experienceQuery.refetch()}
            >
              <RotateCcw size={18} aria-hidden="true" />
              Retry experience
            </button>
          </div>
        ) : null}

        {!experienceQuery.isLoading && !experienceQuery.isError ? (
          experiences.length > 0 ? (
            <ol className="m-0 grid list-none gap-4 p-0">
              {experiences.map((experience) => (
                <li
                  className="grid gap-3 border-l-4 border-teal-700 bg-white py-4 pl-4 pr-5 md:grid-cols-[180px_1fr]"
                  key={experience.id}
                >
                  <div className="grid content-start gap-2 text-slate-700">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-950">
                      <BriefcaseBusiness size={18} aria-hidden="true" />
                      {formatExperienceRange(experience)}
                    </span>
                    <span>{experience.employmentType}</span>
                    {experience.location ? (
                      <span>{experience.location}</span>
                    ) : null}
                    {experience.isCurrent ? (
                      <span className="max-w-max border border-teal-700 px-2 py-1 text-sm font-medium text-teal-800">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <article className="grid gap-3">
                    <div>
                      <h3 className="m-0 text-xl font-semibold text-slate-950">
                        {experience.role}
                      </h3>
                      <p className="m-0 mt-1 text-slate-700">
                        {experience.company}
                      </p>
                    </div>
                    <p className="m-0 whitespace-pre-line leading-7 text-slate-700">
                      {experience.summary}
                    </p>
                    {experience.achievements.length > 0 ? (
                      <ul className="m-0 grid gap-2 pl-5 text-slate-700">
                        {experience.achievements.map((achievement) => (
                          <li key={achievement}>{achievement}</li>
                        ))}
                      </ul>
                    ) : null}
                    {experience.technologies.length > 0 ? (
                      <TechStack values={experience.technologies} />
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <p role="status">No public experience entries are available.</p>
          )
        ) : null}
      </section>

      <section className="mt-8 grid gap-5" aria-labelledby="projects-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="m-0 text-sm font-semibold uppercase tracking-wide text-teal-700">
              Selected work
            </p>
            <h2
              id="projects-heading"
              className="m-0 text-[28px] font-semibold text-slate-950"
            >
              Published projects
            </h2>
          </div>
          {projects.length > 0 ? (
            <a
              className={PRIMARY_LINK_CLASS}
              href="/projects"
              onClick={(event) => {
                event.preventDefault();
                onNavigate('/projects');
              }}
            >
              View all projects
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          ) : null}
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
              Retry projects
            </button>
          </div>
        ) : null}

        {!projectsQuery.isLoading && !projectsQuery.isError ? (
          highlightedProjects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {highlightedProjects.map((project) => (
                <article className={PANEL_CLASS} key={project.id}>
                  <ProjectImage project={project} />
                  <div className="mt-4 grid gap-3">
                    <div>
                      <h3 className="m-0 text-xl font-semibold text-slate-950">
                        {project.title}
                      </h3>
                      <p className="m-0 mt-1 text-slate-700">
                        {project.summary}
                      </p>
                    </div>
                    <TechStack values={project.techStack} />
                    <a
                      className={PRIMARY_LINK_CLASS}
                      href={projectPath(project)}
                      aria-label={`View ${project.title} project details`}
                      onClick={(event) => {
                        event.preventDefault();
                        onNavigate(projectPath(project));
                      }}
                    >
                      View project
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p role="status">No public projects are available.</p>
          )
        ) : null}
      </section>
    </main>
  );
}
