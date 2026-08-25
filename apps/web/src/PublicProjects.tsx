import { useEffect } from 'react';
import { ArrowLeft, ExternalLink, RotateCcw } from 'lucide-react';
import type { Project } from '@antin-os/shared';
import { usePublicProject, usePublicProjects } from './queries/project.queries';
import { setDocumentMetadata } from './metadata';

type Navigate = (path: string) => void;

const PAGE_CLASS = 'mx-auto max-w-6xl px-5 py-8';
const PANEL_CLASS = 'border border-slate-300 bg-white p-5';
const BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-slate-400 bg-white px-3 py-2 text-slate-800 hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60';
const PRIMARY_LINK_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 border border-teal-700 bg-teal-700 px-3 py-2 text-white hover:bg-teal-800';

function projectPath(project: Project) {
  return `/projects/${encodeURIComponent(project.slug)}`;
}

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  return error.message.trim() || fallback;
}

function isNotFoundError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('404') ||
    message.includes('not found') ||
    message.includes('"statuscode":404')
  );
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

export function PublicProjectsPage({ onNavigate }: { onNavigate: Navigate }) {
  const projectsQuery = usePublicProjects();
  const projects = projectsQuery.data ?? [];

  useEffect(() => {
    setDocumentMetadata(
      'Projects | AntinOS Portfolio',
      'Browse selected published portfolio projects and technical work.',
    );
  }, []);

  return (
    <main className={PAGE_CLASS}>
      <header className="mb-6 border-b border-slate-300 pb-4">
        <p className="m-0 text-sm font-semibold uppercase tracking-wide text-teal-700">
          Portfolio
        </p>
        <h1 className="m-0 text-[32px] font-semibold text-slate-950">
          Projects
        </h1>
      </header>

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
            Retry public projects
          </button>
        </div>
      ) : null}

      {!projectsQuery.isLoading && !projectsQuery.isError ? (
        projects.length > 0 ? (
          <section
            className="grid gap-4 md:grid-cols-2"
            aria-label="Public projects"
          >
            {projects.map((project) => (
              <article className={PANEL_CLASS} key={project.id}>
                <ProjectImage project={project} />
                <div className="mt-4 grid gap-3">
                  <div>
                    <h2 className="m-0 text-[22px] font-semibold text-slate-950">
                      {project.title}
                    </h2>
                    <p className="m-0 mt-1 text-slate-700">{project.summary}</p>
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
          </section>
        ) : (
          <p role="status">No public projects are available.</p>
        )
      ) : null}
    </main>
  );
}

export function PublicProjectDetailPage({
  slug,
  onNavigate,
}: {
  slug: string;
  onNavigate: Navigate;
}) {
  const projectQuery = usePublicProject(slug);
  const project = projectQuery.data;
  const isNotFound =
    projectQuery.isError && isNotFoundError(projectQuery.error);

  useEffect(() => {
    setDocumentMetadata(
      project
        ? `${project.title} | AntinOS Portfolio`
        : 'Project | AntinOS Portfolio',
      project?.summary ?? 'View a published AntinOS portfolio project.',
    );
  }, [project]);

  return (
    <main className={PAGE_CLASS}>
      <a
        className={`${BUTTON_CLASS} mb-5`}
        href="/projects"
        aria-label="Back to public projects"
        onClick={(event) => {
          event.preventDefault();
          onNavigate('/projects');
        }}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back to projects
      </a>

      {projectQuery.isLoading ? <p role="status">Loading project</p> : null}

      {isNotFound ? (
        <section
          className="grid gap-3 border border-slate-300 bg-white p-5"
          role="status"
        >
          <h1 className="m-0 text-[28px] font-semibold text-slate-950">
            Project not found
          </h1>
          <p className="m-0 text-slate-700">
            This project is unavailable or has not been published.
          </p>
          <a
            className={PRIMARY_LINK_CLASS}
            href="/projects"
            onClick={(event) => {
              event.preventDefault();
              onNavigate('/projects');
            }}
          >
            View all public projects
          </a>
        </section>
      ) : null}

      {projectQuery.isError && !isNotFound ? (
        <div
          className="grid gap-3 border border-red-300 bg-red-50 p-4"
          role="alert"
        >
          <p className="m-0">
            {errorMessage(projectQuery.error, 'Could not load project.')}
          </p>
          <button
            className={BUTTON_CLASS}
            type="button"
            onClick={() => void projectQuery.refetch()}
          >
            <RotateCcw size={18} aria-hidden="true" />
            Retry project
          </button>
        </div>
      ) : null}

      {!projectQuery.isLoading && !projectQuery.isError && project ? (
        <article className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <section className={PANEL_CLASS}>
            <ProjectImage project={project} />
            <div className="mt-5 grid gap-4">
              <header>
                <p className="m-0 text-sm font-semibold uppercase tracking-wide text-teal-700">
                  Project
                </p>
                <h1 className="m-0 text-[32px] font-semibold text-slate-950">
                  {project.title}
                </h1>
                <p className="m-0 mt-2 text-lg text-slate-700">
                  {project.summary}
                </p>
              </header>
              {project.description ? (
                <p className="m-0 whitespace-pre-line text-slate-700">
                  {project.description}
                </p>
              ) : null}
            </div>
          </section>

          <aside className={`${PANEL_CLASS} h-max`}>
            <h2 className="m-0 text-xl font-semibold text-slate-950">
              Details
            </h2>
            <div className="mt-4 grid gap-4">
              <TechStack values={project.techStack} />
              <div className="flex flex-wrap gap-2">
                {project.repoUrl ? (
                  <a
                    className={BUTTON_CLASS}
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${project.title} repository`}
                  >
                    Repository
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                ) : null}
                {project.liveUrl ? (
                  <a
                    className={PRIMARY_LINK_CLASS}
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${project.title} live demo`}
                  >
                    Live demo
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </article>
      ) : null}
    </main>
  );
}
