import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, Clock, CalendarDays, Globe, Pencil, Trash2, ArrowLeftRight } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader, Spinner } from '../components/Loader';

export default function SkillDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mySkills, setMySkills] = useState([]);
  const [offered, setOffered] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/skills/${id}`)
      .then(({ data }) => setSkill(data.skill))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Load the current user's own listings to offer in a swap.
  useEffect(() => {
    if (user) api.get('/skills/mine').then(({ data }) => setMySkills(data.skills)).catch(() => {});
  }, [user]);

  const isOwner = user && skill && skill.user?._id === user._id;

  const sendRequest = async () => {
    if (!offered) return toast.error('Pick a skill to offer in return');
    setSending(true);
    try {
      await api.post('/requests', {
        offeredSkill: offered,
        requestedSkill: skill._id,
        message,
      });
      toast.success('Swap request sent!');
      setMessage('');
      setOffered('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/skills/${skill._id}`);
      toast.success('Listing deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageLoader />;
  if (!skill) return <p className="py-12 text-center text-slate-500">Skill not found.</p>;

  const owner = skill.user || {};

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main */}
      <div className="lg:col-span-2">
        <Link to="/browse" className="text-sm text-slate-500 hover:text-teach">← Back to browse</Link>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="chip bg-teach-soft text-teach-ink dark:bg-teach/20 dark:text-violet-200">{skill.category}</span>
          <span className="chip bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">{skill.experienceLevel}</span>
        </div>

        <h1 className="mt-3 font-display text-3xl font-bold">{skill.skillName}</h1>
        <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
          {skill.description}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Meta icon={Globe} label="Mode" value={skill.mode} />
          <Meta icon={Clock} label="Duration" value={skill.duration || 'Flexible'} />
          <Meta icon={CalendarDays} label="Availability" value={skill.availability || 'Ask'} />
        </div>

        {skill.preferredSkills?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-500">Wants to learn in return</h3>
            <div className="flex flex-wrap gap-1.5">
              {skill.preferredSkills.map((p) => (
                <span key={p} className="chip bg-learn-soft text-learn-ink dark:bg-learn/20 dark:text-teal-200">{p}</span>
              ))}
            </div>
          </div>
        )}

        {skill.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {skill.tags.map((t) => (
              <span key={t} className="chip bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="card p-5">
          <Link to={`/profile/${owner.username}`} className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-teach/15 text-lg font-semibold text-teach dark:text-violet-300">
              {owner.name?.[0]?.toUpperCase() || '?'}
            </span>
            <div>
              <p className="font-semibold">{owner.name}</p>
              <p className="inline-flex items-center gap-1 text-xs text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                {owner.rating?.toFixed?.(1) ?? '—'} · {owner.numReviews ?? 0} reviews
              </p>
            </div>
          </Link>
        </div>

        {isOwner ? (
          <div className="card space-y-2 p-5">
            <p className="text-sm text-slate-500">This is your listing.</p>
            <Link to={`/skills/${skill._id}/edit`} className="btn-ghost w-full">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <button onClick={remove} className="btn w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        ) : user ? (
          <div className="card space-y-3 p-5">
            <h3 className="flex items-center gap-2 font-display font-semibold">
              <ArrowLeftRight className="h-4 w-4 text-teach" /> Propose a swap
            </h3>
            <div>
              <label className="label">Skill you'll offer</label>
              <select className="input" value={offered} onChange={(e) => setOffered(e.target.value)}>
                <option value="">Select one of your skills…</option>
                {mySkills.map((s) => <option key={s._id} value={s._id}>{s.skillName}</option>)}
              </select>
              {mySkills.length === 0 && (
                <p className="mt-1.5 text-xs text-slate-400">
                  You need a listing first.{' '}
                  <Link to="/skills/new" className="text-teach hover:underline">Create one</Link>.
                </p>
              )}
            </div>
            <div>
              <label className="label">Message (optional)</label>
              <textarea
                className="input min-h-[80px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say hi and suggest how you'd like to swap…"
              />
            </div>
            <button className="btn-primary w-full" onClick={sendRequest} disabled={sending || !mySkills.length}>
              {sending ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Send request'}
            </button>
          </div>
        ) : (
          <div className="card p-5 text-center">
            <p className="text-sm text-slate-500">Log in to propose a swap.</p>
            <Link to="/login" className="btn-primary mt-3 w-full">Log in</Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="card p-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
