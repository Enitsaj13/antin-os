import { FormEvent, useState } from 'react';
import { LogIn } from 'lucide-react';
import { useLoginAdminMutation } from './mutations/auth.mutations';

type LoginAdminProps = {
  returnTo: string;
  onLogin: (path: string) => void;
};

const INPUT_CLASS =
  'min-h-10 w-full border border-slate-400 px-2.5 py-2 font-[inherit]';
const PRIMARY_BUTTON_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border border-teal-700 bg-teal-700 px-3 py-2 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60';

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Login failed.';
  }

  const message = error.message.trim();

  try {
    const parsed = JSON.parse(message) as {
      message?: string | string[];
      statusCode?: number;
    };

    if (parsed.statusCode === 429) {
      return 'Too many login attempts. Try again later.';
    }

    if (parsed.statusCode === 401) {
      return 'Invalid username or password.';
    }
  } catch {
    // Fall back to generic handling below.
  }

  if (message.includes('429')) {
    return 'Too many login attempts. Try again later.';
  }

  return 'Invalid username or password.';
}

function safeReturnPath(path: string) {
  if (
    path.startsWith('/admin/') &&
    path !== '/admin/login' &&
    !path.startsWith('//')
  ) {
    return path;
  }

  return '/admin/profile';
}

export function LoginAdmin({ returnTo, onLogin }: LoginAdminProps) {
  const loginMutation = useLoginAdminMutation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (loginMutation.isPending) {
      return;
    }

    setError('');

    try {
      await loginMutation.mutateAsync({
        username,
        password,
      });
      onLogin(safeReturnPath(returnTo));
    } catch (loginError) {
      setError(errorMessage(loginError));
    }
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center px-5 py-10">
      <form
        className="grid gap-4 border border-slate-300 bg-white p-5"
        aria-label="Admin login"
        onSubmit={onSubmit}
      >
        <header>
          <p className="m-0 text-sm font-semibold uppercase tracking-wide text-teal-700">
            Admin
          </p>
          <h1 className="m-0 text-[28px] font-semibold text-slate-950">
            Sign in
          </h1>
        </header>

        {error ? (
          <p
            className="m-0 border border-red-300 bg-red-50 p-3 text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="grid gap-1.5">
          <label htmlFor="admin-username">Username</label>
          <input
            id="admin-username"
            className={INPUT_CLASS}
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            className={INPUT_CLASS}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button
          className={PRIMARY_BUTTON_CLASS}
          type="submit"
          disabled={loginMutation.isPending}
        >
          <LogIn size={18} aria-hidden="true" />
          {loginMutation.isPending ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
