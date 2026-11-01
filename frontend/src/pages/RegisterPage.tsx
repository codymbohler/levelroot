import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="px-12 py-16 flex justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-light mb-8">Join Levelroot</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-mute mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-ps-sm bg-surface-card border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-mute mb-2">
              Username
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-ps-sm bg-surface-card border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-mute mb-2">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-ps-sm bg-surface-card border border-hairline text-ink focus:outline-none focus:border-ps-blue transition-colors"
            />
            <p className="text-xs text-ink-mute mt-2">At least 8 characters.</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 rounded-full bg-ps-blue text-white font-bold tracking-wide hover:bg-ps-blue-hover transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-ink-mute text-sm mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-ps-blue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default RegisterPage;