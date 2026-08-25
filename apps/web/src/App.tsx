import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  FolderKanban,
  LogOut,
  UserRound,
} from 'lucide-react';
import { useLogoutAdminMutation } from './mutations/auth.mutations';
import { useAdminSession } from './queries/auth.queries';
import { ExperienceAdmin } from './ExperienceAdmin';
import { LoginAdmin } from './LoginAdmin';
import { ProfileAdmin } from './ProfileAdmin';
import { ProjectFormPage, ProjectsAdmin } from './ProjectAdmin';
import { PublicHomePage } from './PublicHome';
import { PublicProjectDetailPage, PublicProjectsPage } from './PublicProjects';
import './styles.css';

type Route =
  | { name: 'home' }
  | { name: 'public-projects' }
  | { name: 'public-project-detail'; slug: string }
  | { name: 'login'; returnTo: string }
  | { name: 'profile' }
  | { name: 'projects' }
  | { name: 'experience' }
  | { name: 'new-project' }
  | { name: 'edit-project'; id: string };

function parseRoute(pathname: string): Route {
  if (pathname === '/') {
    return { name: 'home' };
  }

  if (pathname === '/admin/login') {
    const params = new URLSearchParams(window.location.search);

    return {
      name: 'login',
      returnTo: params.get('returnTo') ?? '/admin/profile',
    };
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    return { name: 'profile' };
  }

  if (pathname === '/projects') {
    return { name: 'public-projects' };
  }

  const publicProjectMatch = pathname.match(/^\/projects\/([^/]+)$/);

  if (publicProjectMatch?.[1]) {
    return {
      name: 'public-project-detail',
      slug: decodeURIComponent(publicProjectMatch[1]),
    };
  }

  if (pathname === '/admin/profile') {
    return { name: 'profile' };
  }

  if (pathname === '/admin/projects') {
    return { name: 'projects' };
  }

  if (pathname === '/admin/experience') {
    return { name: 'experience' };
  }

  if (pathname === '/admin/projects/new') {
    return { name: 'new-project' };
  }

  const editMatch = pathname.match(/^\/admin\/projects\/([^/]+)\/edit$/);

  if (editMatch?.[1]) {
    return { name: 'edit-project', id: decodeURIComponent(editMatch[1]) };
  }

  return { name: 'home' };
}

export function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('popstate'));
}

function isAdminRoute(route: Route) {
  return ![
    'home',
    'public-projects',
    'public-project-detail',
    'login',
  ].includes(route.name);
}

function loginPathFor(pathname: string) {
  const returnTo =
    pathname.startsWith('/admin/') && pathname !== '/admin/login'
      ? pathname
      : '/admin/profile';

  return `/admin/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    function syncRoute() {
      setPathname(window.location.pathname);
    }

    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const route = useMemo(() => parseRoute(pathname), [pathname]);
  const isPublicRoute =
    route.name === 'home' ||
    route.name === 'public-projects' ||
    route.name === 'public-project-detail';
  const adminSessionQuery = useAdminSession(!isPublicRoute);
  const logoutMutation = useLogoutAdminMutation();
  const isAuthenticated = Boolean(adminSessionQuery.data?.authenticated);
  const activeSection =
    route.name === 'profile'
      ? 'profile'
      : route.name === 'experience'
        ? 'experience'
        : 'projects';

  function onNavigate(path: string) {
    navigateTo(path);
  }

  async function logout() {
    await logoutMutation.mutateAsync();
    onNavigate('/admin/login');
  }

  useEffect(() => {
    if (
      isAdminRoute(route) &&
      !adminSessionQuery.isLoading &&
      !isAuthenticated
    ) {
      onNavigate(loginPathFor(window.location.pathname));
    }
  }, [adminSessionQuery.isLoading, isAuthenticated, route]);

  if (isPublicRoute) {
    return (
      <>
        {route.name === 'home' ? (
          <PublicHomePage onNavigate={onNavigate} />
        ) : null}
        {route.name === 'public-projects' ? (
          <PublicProjectsPage onNavigate={onNavigate} />
        ) : null}
        {route.name === 'public-project-detail' ? (
          <PublicProjectDetailPage slug={route.slug} onNavigate={onNavigate} />
        ) : null}
      </>
    );
  }

  if (route.name === 'login') {
    return <LoginAdmin returnTo={route.returnTo} onLogin={onNavigate} />;
  }

  if (adminSessionQuery.isLoading || !isAuthenticated) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p role="status">Checking admin session</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-slate-300 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="m-0 text-sm font-semibold uppercase tracking-wide text-teal-700">
            Admin
          </p>
          <h1 className="m-0 text-[30px] font-semibold text-slate-950">
            Portfolio management
          </h1>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Admin navigation">
          <button
            className={`inline-flex min-h-10 items-center gap-2 border px-3 py-2 ${
              activeSection === 'profile'
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-slate-400 bg-white text-slate-800 hover:border-teal-700'
            }`}
            type="button"
            aria-current={activeSection === 'profile' ? 'page' : undefined}
            onClick={() => onNavigate('/admin/profile')}
          >
            <UserRound size={18} aria-hidden="true" />
            Profile
          </button>
          <button
            className={`inline-flex min-h-10 items-center gap-2 border px-3 py-2 ${
              activeSection === 'projects'
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-slate-400 bg-white text-slate-800 hover:border-teal-700'
            }`}
            type="button"
            aria-current={activeSection === 'projects' ? 'page' : undefined}
            onClick={() => onNavigate('/admin/projects')}
          >
            <FolderKanban size={18} aria-hidden="true" />
            Projects
          </button>
          <button
            className={`inline-flex min-h-10 items-center gap-2 border px-3 py-2 ${
              activeSection === 'experience'
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-slate-400 bg-white text-slate-800 hover:border-teal-700'
            }`}
            type="button"
            aria-current={activeSection === 'experience' ? 'page' : undefined}
            onClick={() => onNavigate('/admin/experience')}
          >
            <BriefcaseBusiness size={18} aria-hidden="true" />
            Experience
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-slate-800 hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={logoutMutation.isPending}
            onClick={() => void logout()}
          >
            <LogOut size={18} aria-hidden="true" />
            {logoutMutation.isPending ? 'Signing out' : 'Sign out'}
          </button>
        </nav>
      </header>

      {route.name === 'profile' ? <ProfileAdmin /> : null}
      {route.name === 'projects' ? (
        <ProjectsAdmin onNavigate={onNavigate} />
      ) : null}
      {route.name === 'experience' ? <ExperienceAdmin /> : null}
      {route.name === 'new-project' ? (
        <ProjectFormPage mode="create" onNavigate={onNavigate} />
      ) : null}
      {route.name === 'edit-project' ? (
        <ProjectFormPage
          mode="edit"
          projectId={route.id}
          onNavigate={onNavigate}
        />
      ) : null}
    </main>
  );
}
