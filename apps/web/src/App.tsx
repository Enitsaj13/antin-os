import { useEffect, useMemo, useState } from 'react';
import { FolderKanban, UserRound } from 'lucide-react';
import { ProfileAdmin } from './ProfileAdmin';
import { ProjectFormPage, ProjectsAdmin } from './ProjectAdmin';
import './styles.css';

type Route =
  | { name: 'profile' }
  | { name: 'projects' }
  | { name: 'new-project' }
  | { name: 'edit-project'; id: string };

function parseRoute(pathname: string): Route {
  if (pathname === '/' || pathname === '/admin' || pathname === '/admin/') {
    return { name: 'profile' };
  }

  if (pathname === '/admin/profile') {
    return { name: 'profile' };
  }

  if (pathname === '/admin/projects') {
    return { name: 'projects' };
  }

  if (pathname === '/admin/projects/new') {
    return { name: 'new-project' };
  }

  const editMatch = pathname.match(/^\/admin\/projects\/([^/]+)\/edit$/);

  if (editMatch?.[1]) {
    return { name: 'edit-project', id: decodeURIComponent(editMatch[1]) };
  }

  return { name: 'profile' };
}

export function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('popstate'));
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
  const activeSection = route.name === 'profile' ? 'profile' : 'projects';

  function onNavigate(path: string) {
    navigateTo(path);
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
        </nav>
      </header>

      {route.name === 'profile' ? <ProfileAdmin /> : null}
      {route.name === 'projects' ? (
        <ProjectsAdmin onNavigate={onNavigate} />
      ) : null}
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
