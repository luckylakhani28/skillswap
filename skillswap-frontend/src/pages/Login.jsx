import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Loader';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.identifier.trim(), form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="font-display text-2xl font-bold">Log in to SkillSwap</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Pick up where you left off.
      </p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="identifier">Email or username</label>
          <input
            id="identifier"
            name="identifier"
            className="input"
            value={form.identifier}
            onChange={onChange}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        New here?{' '}
        <Link to="/register" className="font-semibold text-teach hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
