import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Loader';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({
        ...form,
        username: form.username.trim().toLowerCase(),
        email: form.email.trim(),
      });
      toast.success('Account created — welcome to SkillSwap!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="font-display text-2xl font-bold">Create your profile</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Free forever. Start trading skills in minutes.
      </p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" name="name" className="input" value={form.name} onChange={onChange} required />
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            className="input"
            value={form.username}
            onChange={onChange}
            placeholder="lowercase, no spaces"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" value={form.email} onChange={onChange} required />
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
            placeholder="at least 6 characters"
            autoComplete="new-password"
            required
          />
        </div>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teach hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
