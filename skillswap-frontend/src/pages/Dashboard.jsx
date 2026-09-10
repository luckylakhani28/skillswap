import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Layers, Inbox, Send, Handshake, CheckCircle2, Star, Plus, Check, X, Ban, Flag,
} from 'lucide-react';
import api from '../lib/api';
import { PageLoader } from '../components/Loader';
import ReviewModal from '../components/ReviewModal';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null); // { id, name }

  const load = useCallback(async () => {
    try {
      const [s, inc, out, mine] = await Promise.all([
        api.get('/users/me/stats'),
        api.get('/requests/incoming'),
        api.get('/requests/outgoing'),
        api.get('/skills/mine'),
      ]);
      setStats(s.data.stats);
      setIncoming(inc.data.requests);
      setOutgoing(out.data.requests);
      setSkills(mine.data.skills);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Fire a request transition, then refresh everything.
  const act = async (id, action, label) => {
    try {
      await api.put(`/requests/${id}/${action}`);
      toast.success(label);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageLoader />;

  const cards = [
    { label: 'Listings', value: stats.listings, icon: Layers },
    { label: 'Incoming', value: stats.incomingRequests, icon: Inbox },
    { label: 'Outgoing', value: stats.outgoingRequests, icon: Send },
    { label: 'Active swaps', value: stats.acceptedRequests, icon: Handshake },
    { label: 'Completed', value: stats.completedSwaps, icon: CheckCircle2 },
    { label: 'Rating', value: stats.rating?.toFixed(1) ?? '—', icon: Star },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Hi, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Here's what's happening with your swaps.</p>
        </div>
        <Link to="/skills/new" className="btn-primary"><Plus className="h-4 w-4" /> New listing</Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4">
            <Icon className="h-5 w-5 text-teach" />
            <p className="mt-3 font-display text-2xl font-bold">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Incoming requests */}
      <Section title="Incoming requests" empty="No incoming requests yet." items={incoming}>
        {(r) => (
          <RequestRow key={r._id} r={r} counterpart={r.fromUser}>
            {r.status === 'pending' && (
              <>
                <Action onClick={() => act(r._id, 'accept', 'Request accepted')} tone="accent"><Check className="h-4 w-4" /> Accept</Action>
                <Action onClick={() => act(r._id, 'reject', 'Request declined')} tone="ghost"><X className="h-4 w-4" /> Decline</Action>
              </>
            )}
            {r.status === 'accepted' && (
              <Action onClick={() => act(r._id, 'complete', 'Swap completed')} tone="primary"><CheckCircle2 className="h-4 w-4" /> Mark complete</Action>
            )}
            {r.status === 'completed' && !r.reviewedByTo && (
              <Action onClick={() => setReviewTarget({ id: r._id, name: r.fromUser?.name })} tone="ghost"><Star className="h-4 w-4" /> Leave review</Action>
            )}
          </RequestRow>
        )}
      </Section>

      {/* Outgoing requests */}
      <Section title="Outgoing requests" empty="You haven't sent any requests." items={outgoing}>
        {(r) => (
          <RequestRow key={r._id} r={r} counterpart={r.toUser}>
            {(r.status === 'pending' || r.status === 'accepted') && (
              <Action onClick={() => act(r._id, 'cancel', 'Request cancelled')} tone="ghost"><Ban className="h-4 w-4" /> Cancel</Action>
            )}
            {r.status === 'accepted' && (
              <Action onClick={() => act(r._id, 'complete', 'Swap completed')} tone="primary"><CheckCircle2 className="h-4 w-4" /> Mark complete</Action>
            )}
            {r.status === 'completed' && !r.reviewedByFrom && (
              <Action onClick={() => setReviewTarget({ id: r._id, name: r.toUser?.name })} tone="ghost"><Star className="h-4 w-4" /> Leave review</Action>
            )}
          </RequestRow>
        )}
      </Section>

      {/* My listings */}
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">My listings</h2>
        {skills.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            You have no listings yet. <Link to="/skills/new" className="font-semibold text-teach hover:underline">Create your first one.</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {skills.map((s) => (
              <div key={s._id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{s.skillName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.category} · {s.experienceLevel} · {s.mode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/skills/${s._id}`} className="btn-ghost">View</Link>
                  <Link to={`/skills/${s._id}/edit`} className="btn-ghost">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {reviewTarget && (
        <ReviewModal
          swapRequestId={reviewTarget.id}
          revieweeName={reviewTarget.name}
          onClose={() => setReviewTarget(null)}
          onDone={load}
        />
      )}
    </div>
  );
}

function Section({ title, empty, items, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <span className="chip bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500 dark:text-slate-400">{empty}</div>
      ) : (
        <div className="space-y-2">{items.map(children)}</div>
      )}
    </section>
  );
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  accepted: 'bg-learn-soft text-learn-ink dark:bg-learn/20 dark:text-teal-200',
  completed: 'bg-teach-soft text-teach-ink dark:bg-teach/20 dark:text-violet-200',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

function RequestRow({ r, counterpart, children }) {
  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{counterpart?.name || 'A student'}</span>
          <span className={`chip ${STATUS_STYLES[r.status]}`}>{r.status}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Offering <b className="text-teach dark:text-violet-300">{r.offeredSkill?.skillName || '—'}</b>
          {' '}for <b className="text-learn dark:text-teal-300">{r.requestedSkill?.skillName || '—'}</b>
        </p>
        {r.message && <p className="mt-1 line-clamp-1 text-xs italic text-slate-400">"{r.message}"</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Action({ tone = 'ghost', ...props }) {
  const cls = { primary: 'btn-primary', accent: 'btn-accent', ghost: 'btn-ghost' }[tone];
  return <button className={cls} {...props} />;
}
