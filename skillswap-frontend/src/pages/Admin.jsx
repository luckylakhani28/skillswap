import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users as UsersIcon, Layers, Repeat, CheckCircle2, Star, Ban, Trash2, ShieldCheck,
  ShieldAlert, Plus, BarChart3, MessageSquareWarning, FolderCog,
} from 'lucide-react';
import api from '../lib/api';
import { PageLoader, Spinner } from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: UsersIcon },
  { id: 'reviews', label: 'Reviews', icon: MessageSquareWarning },
  { id: 'categories', label: 'Categories', icon: FolderCog },
];

export default function Admin() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-teach" />
          <h1 className="font-display text-3xl font-bold">Admin</h1>
        </div>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Moderate the platform and keep an eye on the numbers.</p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'border-teach text-teach dark:text-violet-300'
                : 'border-transparent text-slate-500 hover:text-ink dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'reviews' && <ReviewsPanel />}
      {tab === 'categories' && <CategoriesPanel />}
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setData(data)).catch((e) => toast.error(e.message));
  }, []);

  if (!data) return <PageLoader />;

  const cards = [
    { label: 'Users', value: data.stats.users, icon: UsersIcon },
    { label: 'Listings', value: data.stats.skills, icon: Layers },
    { label: 'Total swaps', value: data.stats.swaps, icon: Repeat },
    { label: 'Completed', value: data.stats.completedSwaps, icon: CheckCircle2 },
    { label: 'Reviews', value: data.stats.reviews, icon: Star },
    { label: 'Banned', value: data.stats.bannedUsers, icon: Ban },
  ];

  const total = data.swapsByStatus.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4">
            <Icon className="h-5 w-5 text-teach" />
            <p className="mt-3 font-display text-2xl font-bold">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display font-semibold">Swaps by status</h2>
        {data.swapsByStatus.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No swaps yet.</p>
        ) : (
          <div className="space-y-3">
            {data.swapsByStatus.map((s) => (
              <div key={s._id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-slate-600 dark:text-slate-300">{s._id}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-teach" style={{ width: `${(s.count / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Users ---------------- */
function UsersPanel() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search: search || undefined, page, limit: 15 } });
      setUsers(data.users);
      setPages(data.pages);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const toggleBan = async (u) => {
    try {
      await api.put(`/admin/users/${u._id}/${u.isBanned ? 'unban' : 'ban'}`);
      toast.success(u.isBanned ? 'User unbanned' : 'User banned');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Permanently delete ${u.username} and all their data? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      toast.success('User deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <input
        className="input"
        placeholder="Search by name, username, or email…"
        value={search}
        onChange={(e) => { setPage(1); setSearch(e.target.value); }}
      />

      {loading ? <PageLoader /> : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((u) => {
            const isSelf = u._id === me?._id;
            return (
              <div key={u._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{u.name}</span>
                    {u.role === 'admin' && <span className="chip bg-teach-soft text-teach-ink dark:bg-teach/20 dark:text-violet-200">admin</span>}
                    {u.isBanned && <span className="chip bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">banned</span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">@{u.username} · {u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-ghost"
                    onClick={() => toggleBan(u)}
                    disabled={isSelf}
                    title={isSelf ? "You can't ban yourself" : ''}
                  >
                    {u.isBanned ? <><ShieldCheck className="h-4 w-4" /> Unban</> : <><ShieldAlert className="h-4 w-4" /> Ban</>}
                  </button>
                  <button
                    className="btn-ghost text-rose-500"
                    onClick={() => remove(u)}
                    disabled={isSelf}
                    title={isSelf ? "You can't delete yourself" : ''}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {users.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No users found.</p>}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="px-2 text-sm text-slate-500">Page {page} of {pages}</span>
          <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Reviews ---------------- */
function ReviewsPanel() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reviews');
      setReviews(data.reviews);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this review? The user\'s rating will be recalculated.')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success('Review deleted');
      setReviews((list) => list.filter((r) => r._id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-2">
      {reviews.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500 dark:text-slate-400">No reviews to moderate.</div>
      ) : reviews.map((r) => (
        <div key={r._id} className="card flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">@{r.reviewer?.username || '?'}</span>
              <span className="text-slate-400">→ @{r.reviewee?.username || '?'}</span>
              <span className="inline-flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`} />
                ))}
              </span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
          </div>
          <button className="btn-ghost text-rose-500" onClick={() => remove(r._id)} aria-label="Delete review">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Categories ---------------- */
function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', icon: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/categories', form);
      toast.success('Category added');
      setForm({ name: '', icon: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories((list) => list.filter((c) => c._id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="w-20">
          <label className="label">Icon</label>
          <input className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🎨" />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Photography" required />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="btn-primary" disabled={saving}>
          {saving ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <><Plus className="h-4 w-4" /> Add</>}
        </button>
      </form>

      <div className="grid gap-2 sm:grid-cols-2">
        {categories.map((c) => (
          <div key={c._id} className="card flex items-center justify-between p-3">
            <span className="flex items-center gap-2">
              <span className="text-lg">{c.icon || '📚'}</span>
              <span className="font-medium">{c.name}</span>
            </span>
            <button className="text-slate-300 hover:text-rose-500" onClick={() => remove(c._id)} aria-label={`Delete ${c.name}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
