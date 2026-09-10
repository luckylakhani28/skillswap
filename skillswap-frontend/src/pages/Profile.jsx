import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, GraduationCap, MapPin, Link as LinkIcon, Github, Linkedin, Pencil, MessageSquare,
} from 'lucide-react';
import api from '../lib/api';
import { PageLoader } from '../components/Loader';
import SkillCard from '../components/SkillCard';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/users/${username}`)
      .then(async ({ data }) => {
        if (!active) return;
        setProfile(data.user);
        setSkills(data.skills || []);
        const { data: rev } = await api.get(`/reviews/user/${data.user._id}`);
        if (active) setReviews(rev.reviews);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [username]);

  if (loading) return <PageLoader />;
  if (notFound) {
    return (
      <div className="card p-12 text-center">
        <p className="font-display text-lg font-semibold">No such user</p>
        <p className="mt-1 text-sm text-slate-500">We couldn't find @{username}.</p>
      </div>
    );
  }

  const isMe = me?.username === profile.username;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-teach to-learn" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar user={profile} />
            {isMe ? (
              <Link to="/settings/profile" className="btn-ghost"><Pencil className="h-4 w-4" /> Edit profile</Link>
            ) : me ? (
              <Link to={`/messages/${profile._id}`} className="btn-primary"><MessageSquare className="h-4 w-4" /> Message</Link>
            ) : null}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {profile.rating?.toFixed(1)} ({profile.numReviews})</span>
            {profile.college && <span className="inline-flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {profile.college}</span>}
            {profile.availability && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.availability}</span>}
          </div>

          {profile.bio && <p className="mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{profile.bio}</p>}

          <div className="mt-4 flex gap-3 text-slate-500">
            {profile.github && <Social href={profile.github} icon={Github} />}
            {profile.linkedin && <Social href={profile.linkedin} icon={Linkedin} />}
            {profile.portfolio && <Social href={profile.portfolio} icon={LinkIcon} />}
          </div>
        </div>
      </div>

      {/* Teach / learn */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SkillList title="Can teach" tone="teach" items={profile.skillsCanTeach} />
        <SkillList title="Wants to learn" tone="learn" items={profile.skillsWantToLearn} />
      </div>

      {/* Listings */}
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Listings</h2>
        {skills.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500 dark:text-slate-400">No active listings.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((s) => <SkillCard key={s._id} skill={{ ...s, user: profile }} />)}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500 dark:text-slate-400">No reviews yet.</div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rv) => (
              <div key={rv._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{rv.reviewer?.name || 'Anonymous'}</span>
                  <span className="inline-flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < rv.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`} />
                    ))}
                  </span>
                </div>
                {rv.comment && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{rv.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Avatar({ user }) {
  const ring = 'h-20 w-20 rounded-2xl ring-4 ring-white dark:ring-surface-card';
  if (user.profilePicture) return <img src={user.profilePicture} alt={user.name} className={`${ring} object-cover`} />;
  return (
    <span className={`${ring} grid place-items-center bg-teach text-2xl font-bold text-white`}>
      {user.name?.[0]?.toUpperCase() || 'U'}
    </span>
  );
}

function Social({ href, icon: Icon }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="hover:text-teach">
      <Icon className="h-5 w-5" />
    </a>
  );
}

function SkillList({ title, tone, items = [] }) {
  const styles = tone === 'teach'
    ? 'bg-teach-soft text-teach-ink dark:bg-teach/20 dark:text-violet-200'
    : 'bg-learn-soft text-learn-ink dark:bg-learn/20 dark:text-teal-200';
  return (
    <div className="card p-5">
      <h3 className="mb-3 font-display font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing listed.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((s) => <span key={s} className={`chip ${styles}`}>{s}</span>)}
        </div>
      )}
    </div>
  );
}
